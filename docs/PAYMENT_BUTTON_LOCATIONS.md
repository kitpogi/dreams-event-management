# Payment Button Locations

This document shows where the "Pay Now" payment buttons are located in the codebase.

---

## 📍 Payment Button Locations

### 1. **Client Dashboard - List View** 
**File:** `dreams-frontend/src/pages/Dashboard/client/ClientDashboard.jsx`

**Location 1: Booking Cards (Lines 599-611)**
```jsx
{canShowPayButton(booking) && (
  <div className="mt-3">
    <Button
      variant="default"
      size="sm"
      onClick={() => handlePayNow(booking)}
      className="bg-[#a413ec] hover:bg-[#8a0fd4] text-white"
    >
      <CreditCard className="w-4 h-4 mr-1" />
      Pay Now
    </Button>
  </div>
)}
```

**Location 2: Data Table Actions Column (Lines 800-810)**
```jsx
{canShowPayButton(row) && (
  <Button
    variant="default"
    size="sm"
    onClick={() => handlePayNow(row)}
    className="bg-[#a413ec] hover:bg-[#8a0fd4] text-white"
  >
    <CreditCard className="w-4 h-4 mr-1" />
    Pay Now
  </Button>
)}
```

**Handler Function (Lines 172-177):**
```jsx
const handlePayNow = async (booking) => {
  const bookingId = booking.booking_id || booking.id;
  await fetchBookingPayments(bookingId);
  setSelectedBookingForPayment(booking);
  setShowPaymentModal(true);
};
```

**Visibility Logic (Lines 196-204):**
```jsx
const canShowPayButton = (booking) => {
  const { paymentStatus, remainingBalance } = getPaymentInfo(booking);
  return (
    booking?.payment_required !== false &&
    paymentStatus !== 'paid' &&
    remainingBalance > 0 &&
    (booking?.booking_status || booking?.status || '').toLowerCase() !== 'cancelled'
  );
};
```

**Payment Modal (Lines 51-52, 875+):**
```jsx
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
```

---

### 2. **Booking Confirmation Page**
**File:** `dreams-frontend/src/pages/public/BookingConfirmation.jsx`

**Location (Lines 396-408):**
```jsx
{/* Pay Now Button */}
{showPaymentButton && (
  <div className="mb-6">
    <Button
      onClick={() => setShowPaymentModal(true)}
      className="w-full md:w-auto"
      size="lg"
    >
      <CreditCard className="w-5 h-5 mr-2" />
      Pay Now
    </Button>
  </div>
)}
```

**Visibility Logic (Lines 123-128):**
```jsx
// Check if payment button should be shown
const showPaymentButton = 
  booking?.payment_required !== false &&
  paymentStatus !== 'paid' &&
  remainingBalance > 0 &&
  (booking?.booking_status || booking?.status || '').toLowerCase() !== 'cancelled';
```

---

## 🔍 How Payment Buttons Work

### Button Visibility Conditions

The payment button is shown when **ALL** of these conditions are met:

1. ✅ `payment_required !== false` - Payment is required for the booking
2. ✅ `paymentStatus !== 'paid'` - Booking is not fully paid
3. ✅ `remainingBalance > 0` - There's a remaining balance to pay
4. ✅ Booking status is not `'cancelled'`

### Button Click Flow

```
User Clicks "Pay Now"
    ↓
handlePayNow(booking) called
    ↓
Fetch booking payments
    ↓
Set selected booking for payment
    ↓
Open PaymentModal
    ↓
PaymentForm component displayed
    ↓
User completes payment
```

---

## 🎨 Button Styling

### Client Dashboard Buttons:
- **Color:** Purple (`bg-[#a413ec]`)
- **Hover:** Darker purple (`hover:bg-[#8a0fd4]`)
- **Size:** Small (`size="sm"`)
- **Icon:** CreditCard icon (4x4)

### Booking Confirmation Button:
- **Color:** Default button style
- **Size:** Large (`size="lg"`)
- **Icon:** CreditCard icon (5x5)
- **Width:** Full width on mobile, auto on desktop

---

## 📦 Related Components

### Payment Modal
**File:** `dreams-frontend/src/components/features/PaymentForm.jsx`

The payment modal uses the `PaymentForm` component which:
- Shows payment method selection
- Creates payment intent
- Handles payment processing
- Shows payment status

### Payment Service
**File:** `dreams-frontend/src/api/services/paymentService.js`

Contains API functions:
- `createPaymentIntent()`
- `attachPaymentMethod()`
- `getPaymentStatus()`
- `getBookingPayments()`

---

## 🔄 Complete Payment Flow from Button Click

```
1. User clicks "Pay Now" button
   └─> handlePayNow(booking) called

2. Fetch booking payments
   └─> getBookingPayments(bookingId)

3. Set selected booking
   └─> setSelectedBookingForPayment(booking)

4. Open payment modal
   └─> setShowPaymentModal(true)

5. PaymentForm component renders
   └─> User selects payment method
   └─> User clicks "Continue to Payment"

6. Create payment intent
   └─> POST /api/payments/create-intent

7. Process payment
   └─> PayMongo SDK handles payment

8. Payment success
   └─> handlePaymentSuccess() called
   └─> Modal closes
   └─> Bookings refreshed
```

---

## 📝 Quick Reference

| Location | File | Lines | Context |
|----------|------|-------|---------|
| Client Dashboard - Cards | `ClientDashboard.jsx` | 599-611 | Booking card view |
| Client Dashboard - Table | `ClientDashboard.jsx` | 800-810 | Data table actions |
| Booking Confirmation | `BookingConfirmation.jsx` | 396-408 | Public booking page |

---

## 🛠️ To Modify Payment Button

### Change Button Text:
Search for: `Pay Now` in the files above

### Change Button Style:
Modify the `className` prop in the Button components

### Change Visibility Logic:
Modify the `canShowPayButton()` or `showPaymentButton` conditions

### Change Click Handler:
Modify the `handlePayNow()` function

---

## 🎯 Summary

**Payment buttons are located in:**
1. ✅ Client Dashboard (2 locations: cards and table)
2. ✅ Booking Confirmation page

**All buttons:**
- Use the same `PaymentForm` component
- Check the same visibility conditions
- Follow the same payment flow
- Open the same payment modal
