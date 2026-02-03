# Payment Flow with Deposit - Implementation Plan

## 🎯 Recommended Payment Flow Strategy

### **Best Practice: Hybrid Approach**

**Allow deposit payment BEFORE approval** (to secure booking)  
**Require remaining balance AFTER approval** (to confirm event)

This approach:
- ✅ Secures the booking with a deposit
- ✅ Shows client commitment
- ✅ Protects business (deposit is non-refundable if client cancels)
- ✅ Allows flexibility (client can pay full amount anytime)

---

## 📊 Complete Payment Flow

### **Flow 1: Booking Creation → Deposit Payment (Pending Status)**

```
1. Client creates booking
   └─> Status: "Pending"
   └─> Payment Status: "Unpaid"
   └─> Total Amount: Calculated
   └─> Deposit Amount: 30% of total (configurable)

2. Client can pay deposit immediately
   └─> "Pay Now" button visible
   └─> Can pay: Deposit OR Full Amount
   └─> Payment processed via PayMongo

3. After deposit payment:
   └─> Payment Status: "Partial"
   └─> Remaining Balance: Total - Deposit
   └─> Booking still "Pending" (awaiting admin approval)
```

### **Flow 2: Booking Approval → Remaining Balance**

```
1. Admin approves booking
   └─> Status: "Approved"
   └─> Payment Status: "Partial" (if deposit paid) or "Unpaid"
   └─> Client notified via email

2. Client must pay remaining balance
   └─> "Pay Now" button shows remaining balance
   └─> Can pay: Remaining Balance OR Full Amount
   └─> Payment deadline: Before event date (e.g., 7 days before)

3. After full payment:
   └─> Payment Status: "Paid"
   └─> Booking confirmed
```

---

## 🔄 Payment Timing Rules

### **When Payment is Allowed:**

| Booking Status | Deposit Payment | Full Payment | Remaining Balance |
|---------------|----------------|-------------|-------------------|
| **Pending**    | ✅ Allowed     | ✅ Allowed  | ❌ Not shown      |
| **Approved**   | ✅ Allowed*    | ✅ Allowed  | ✅ Required       |
| **Confirmed**  | ✅ Allowed*    | ✅ Allowed  | ✅ Required       |
| **Cancelled**  | ❌ Blocked     | ❌ Blocked  | ❌ Blocked        |
| **Completed**  | ❌ Blocked      | ❌ Blocked  | ❌ Blocked        |

*Deposit already paid, but can pay additional amounts

### **Payment Button Logic:**

```javascript
// Show "Pay Now" button if:
1. Booking is not cancelled/completed
2. Payment is required
3. Payment status is not "paid"
4. There's a remaining balance OR booking is pending (for deposit)
```

---

## 💻 Implementation Steps

### **Step 1: Update Booking Creation (Backend)**

**File:** `dreams-backend/app/Http/Controllers/Api/BookingController.php`

```php
public function store(Request $request)
{
    // ... existing validation ...
    
    $package = EventPackage::with('venue')->findOrFail($request->package_id);
    $totalAmount = $package->package_price;
    $depositAmount = $totalAmount * 0.30; // 30% deposit (configurable)
    
    $bookingData = [
        // ... existing fields ...
        'total_amount' => $totalAmount,
        'deposit_amount' => $depositAmount,
        'payment_required' => true,
        'payment_status' => 'unpaid',
        'booking_status' => 'Pending',
    ];
    
    $booking = BookingDetail::create($bookingData);
    // ... rest of code ...
}
```

### **Step 2: Update Payment Button Logic (Frontend)**

**File:** `dreams-frontend/src/pages/Dashboard/client/ClientDashboard.jsx`

```javascript
const canShowPayButton = (booking) => {
  const { paymentStatus, remainingBalance, totalAmount } = getPaymentInfo(booking);
  const isCancelled = (booking?.booking_status || booking?.status || '').toLowerCase() === 'cancelled';
  const isCompleted = (booking?.booking_status || booking?.status || '').toLowerCase() === 'completed';
  const bookingStatus = (booking?.booking_status || booking?.status || '').toLowerCase();
  const paymentRequired = booking?.payment_required !== false;
  
  // Don't show if cancelled or completed
  if (isCancelled || isCompleted) return false;
  
  // Don't show if payment not required
  if (!paymentRequired) return false;
  
  // Don't show if fully paid
  if (paymentStatus === 'paid') return false;
  
  // Show if:
  // 1. Pending status: Allow deposit or full payment
  // 2. Approved/Confirmed: Show remaining balance
  if (bookingStatus === 'pending') {
    // Allow payment even if no balance (for initial deposit)
    return totalAmount > 0;
  } else {
    // For approved/confirmed, show if there's remaining balance
    return remainingBalance > 0;
  }
};
```

### **Step 3: Update Payment Form to Show Deposit Option**

**File:** `dreams-frontend/src/components/features/PaymentForm.jsx`

Add deposit amount calculation and display:

```javascript
export default function PaymentForm({ bookingId, amount, booking, onSuccess, onCancel }) {
  const [paymentType, setPaymentType] = useState('remaining'); // 'deposit' | 'remaining' | 'full'
  
  // Calculate amounts
  const depositAmount = booking?.deposit_amount || (amount * 0.30);
  const remainingBalance = booking?.remaining_balance || amount;
  const totalAmount = booking?.total_amount || amount;
  const bookingStatus = (booking?.booking_status || '').toLowerCase();
  
  // Determine available payment options
  const canPayDeposit = bookingStatus === 'pending' && paymentStatus !== 'paid';
  const canPayRemaining = bookingStatus !== 'pending' && remainingBalance > 0;
  const canPayFull = paymentStatus !== 'paid';
  
  // Determine default payment amount
  const getPaymentAmount = () => {
    if (paymentType === 'deposit') return depositAmount;
    if (paymentType === 'remaining') return remainingBalance;
    if (paymentType === 'full') return totalAmount;
    return remainingBalance || depositAmount || totalAmount;
  };
  
  // ... rest of component ...
}
```

### **Step 4: Add Payment Type Metadata**

**File:** `dreams-backend/app/Models/Payment.php`

Add payment type to track if it's deposit, remaining, or full:

```php
// Migration: Add payment_type to payments table
$table->enum('payment_type', ['deposit', 'remaining', 'full', 'partial'])->nullable()->after('amount');
```

**File:** `dreams-backend/app/Http/Controllers/Api/PaymentController.php`

```php
public function createPaymentIntent(Request $request)
{
    // ... existing validation ...
    
    // Add payment type
    $paymentType = $request->payment_type ?? 'remaining'; // 'deposit', 'remaining', 'full'
    
    // Create payment record with type
    $payment = Payment::create([
        'booking_id' => $booking->booking_id,
        'payment_intent_id' => $result['payment_intent_id'],
        'amount' => $result['amount'],
        'currency' => $result['currency'],
        'status' => 'pending',
        'payment_type' => $paymentType,
    ]);
    
    // ... rest of code ...
}
```

### **Step 5: Update Payment Status Calculation**

**File:** `dreams-backend/app/Services/PaymentService.php`

```php
protected function updateBookingPaymentStatus(BookingDetail $booking): void
{
    $totalPaid = Payment::where('booking_id', $booking->booking_id)
        ->where('status', 'paid')
        ->sum('amount');

    $totalAmount = $booking->total_amount ?? 0;
    $depositAmount = $booking->deposit_amount ?? 0;

    // Update payment status
    if ($totalPaid >= $totalAmount) {
        $booking->payment_status = 'paid';
    } elseif ($totalPaid >= $depositAmount && $totalPaid > 0) {
        $booking->payment_status = 'partial';
    } else {
        $booking->payment_status = 'unpaid';
    }

    $booking->save();
}
```

### **Step 6: Add Payment Reminders**

**File:** `dreams-backend/app/Console/Commands/SendPaymentReminders.php` (Create new)

```php
public function handle()
{
    // Find approved bookings with partial/unpaid status
    $bookings = BookingDetail::where('booking_status', 'Approved')
        ->whereIn('payment_status', ['unpaid', 'partial'])
        ->where('event_date', '>', now())
        ->where('event_date', '<=', now()->addDays(7)) // 7 days before event
        ->get();
    
    foreach ($bookings as $booking) {
        // Send payment reminder email
        Mail::to($booking->client->client_email)->send(
            new PaymentReminderMail($booking)
        );
    }
}
```

---

## 📋 Payment Amount Calculation Logic

### **For Pending Bookings:**
- **Deposit Option:** 30% of total amount
- **Full Payment Option:** 100% of total amount
- **Remaining Balance:** Not shown (no payment made yet)

### **For Approved/Confirmed Bookings:**
- **Deposit:** Already paid (if applicable)
- **Remaining Balance:** Total - Total Paid
- **Full Payment:** Total amount (if paying everything at once)

### **Payment Status Updates:**
- **Unpaid:** No payments made
- **Partial:** Deposit paid OR some amount paid but not full
- **Paid:** Total paid >= Total amount

---

## 🎨 UI/UX Improvements

### **Payment Form Enhancements:**

1. **Show Payment Options Based on Status:**
   ```
   Pending Booking:
   - [ ] Pay Deposit (₱15,000) - Secure your booking
   - [ ] Pay in Full (₱50,000) - Complete payment now
   
   Approved Booking (Deposit Paid):
   - [ ] Pay Remaining Balance (₱35,000) - Due before event
   - [ ] Pay in Full (₱50,000) - Complete payment
   
   Approved Booking (No Payment):
   - [ ] Pay Deposit (₱15,000) - Secure your booking
   - [ ] Pay in Full (₱50,000) - Complete payment
   ```

2. **Payment Summary Display:**
   ```
   Total Amount: ₱50,000.00
   Deposit Amount: ₱15,000.00 (30%)
   Amount Paid: ₱15,000.00
   Remaining Balance: ₱35,000.00
   ```

3. **Status Messages:**
   ```
   Pending + Unpaid: "Pay a deposit to secure your booking"
   Pending + Partial: "Deposit paid. Awaiting approval."
   Approved + Partial: "Please pay remaining balance before event"
   Approved + Unpaid: "Please make payment to confirm booking"
   ```

---

## 🔐 Business Rules

### **Deposit Policy:**
- ✅ Deposit is **non-refundable** if client cancels
- ✅ Deposit is **refundable** if admin cancels/rejects
- ✅ Deposit **secures the booking** but doesn't guarantee approval
- ✅ Deposit amount is **configurable** (default: 30%)

### **Payment Deadlines:**
- ✅ Remaining balance due **7 days before event**
- ✅ Full payment required **before event date**
- ✅ Late payment may incur **additional fees** (optional)

### **Cancellation Policy:**
- ✅ If cancelled before approval: Deposit refunded
- ✅ If cancelled after approval: Deposit forfeited
- ✅ If cancelled by admin: Full refund

---

## 📊 Database Schema Updates

### **Payments Table:**
```sql
ALTER TABLE payments ADD COLUMN payment_type ENUM('deposit', 'remaining', 'full', 'partial') NULL AFTER amount;
```

### **Booking Details (Already exists):**
```sql
- total_amount DECIMAL(10,2) - Total booking amount
- deposit_amount DECIMAL(10,2) - Deposit amount (30%)
- payment_required BOOLEAN - Whether payment is required
- payment_status ENUM('unpaid', 'partial', 'paid', 'refunded')
```

---

## 🧪 Testing Scenarios

### **Scenario 1: Deposit Before Approval**
1. Client creates booking (Pending)
2. Client pays deposit (₱15,000)
3. Payment status: Partial
4. Admin approves booking
5. Client pays remaining balance (₱35,000)
6. Payment status: Paid ✅

### **Scenario 2: Full Payment Before Approval**
1. Client creates booking (Pending)
2. Client pays full amount (₱50,000)
3. Payment status: Paid
4. Admin approves booking
5. No further payment needed ✅

### **Scenario 3: Payment After Approval**
1. Client creates booking (Pending)
2. No payment made
3. Admin approves booking
4. Client pays deposit (₱15,000)
5. Payment status: Partial
6. Client pays remaining (₱35,000)
7. Payment status: Paid ✅

### **Scenario 4: Cancellation**
1. Client creates booking (Pending)
2. Client pays deposit (₱15,000)
3. Client cancels booking
4. Deposit refunded (or forfeited based on policy) ✅

---

## 🚀 Implementation Priority

### **Phase 1: Core Functionality** (High Priority)
1. ✅ Update booking creation to set deposit_amount
2. ✅ Update payment button logic for pending bookings
3. ✅ Add payment_type to payments table
4. ✅ Update payment status calculation

### **Phase 2: UI Enhancements** (Medium Priority)
1. ✅ Update PaymentForm to show deposit option
2. ✅ Add payment summary display
3. ✅ Add status messages
4. ✅ Improve payment flow UX

### **Phase 3: Advanced Features** (Low Priority)
1. ✅ Payment reminders
2. ✅ Payment deadlines
3. ✅ Refund handling
4. ✅ Payment history tracking

---

## 📝 Summary

**Recommended Flow:**
1. ✅ **Allow deposit payment when booking is Pending** (secures booking)
2. ✅ **Require remaining balance after Approval** (confirms event)
3. ✅ **Allow full payment anytime** (flexibility)
4. ✅ **Clear messaging** about payment timing and requirements

This approach balances:
- Client convenience (can pay deposit early)
- Business protection (deposit secures booking)
- Clear expectations (payment requirements based on status)
