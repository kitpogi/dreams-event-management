# Payment Flow Documentation

**Last Updated:** December 2024  
**Payment Gateway:** PayMongo  
**Status:** ✅ Fully Implemented

---

## 📊 Payment Flow Overview

The payment system uses **PayMongo** as the payment gateway and follows a secure, multi-step process from booking creation to payment confirmation.

---

## 🔄 Complete Payment Flow

### **Step 1: Booking Creation**

1. User selects a package and fills out booking form
2. Booking is created with status `pending` and payment status `unpaid`
3. Booking details are saved to database
4. User is redirected to booking confirmation page

**Files:**

- `BookingFormModal.jsx` - Booking form component
- `BookingController.php` - Backend booking creation

---

### **Step 2: Payment Initiation**

1. User clicks "Pay Now" or "Make Payment" button
2. `PaymentForm` component is displayed
3. User selects payment method:
   - Credit/Debit Card
   - GCash
   - Maya
   - QR Ph
   - Bank Transfer

**Files:**

- `PaymentForm.jsx` - Payment method selection UI
- `paymentService.js` - Frontend payment API calls

---

### **Step 3: Create Payment Intent**

1. Frontend calls `createPaymentIntent(bookingId, amount, paymentMethods)`
2. Backend `PaymentController::createPaymentIntent()` is called
3. Backend validates:
   - Booking exists and belongs to user
   - Amount is valid
   - Payment methods are allowed
4. `PaymentService::createPaymentIntent()` is called
5. PayMongo API is called to create payment intent:
   ```php
   POST /payment_intents
   {
     amount: amount * 100, // Convert to centavos
     currency: 'PHP',
     payment_method_allowed: ['card', 'gcash', 'maya'],
     metadata: { booking_id, client_id, package_id }
   }
   ```
6. Payment record is created in database with status `pending`
7. Response includes:
   - `payment_intent_id` - PayMongo payment intent ID
   - `client_key` - Public key for PayMongo SDK
   - `amount` - Payment amount
   - `currency` - PHP

**Files:**

- `PaymentController.php::createPaymentIntent()`
- `PaymentService.php::createPaymentIntent()`
- `Payment.php` - Payment model

**API Endpoint:**

```
POST /api/payments/create-intent
Body: {
  booking_id: number,
  amount: number,
  payment_methods: string[]
}
```

---

### **Step 4: Payment Processing**

#### **For Card Payments:**

1. PayMongo JS SDK is loaded (`https://js.paymongo.com/v1`)
2. Payment form is initialized with `client_key` and `payment_intent_id`
3. PayMongo payment form is mounted to `#paymongo-payment-form` div
4. User enters card details (handled securely by PayMongo)
5. On successful card entry:
   - PayMongo returns `paymentMethodId`
   - Frontend calls `attachPaymentMethod(paymentIntentId, paymentMethodId)`
   - Backend attaches payment method to payment intent via PayMongo API
   - Payment status is updated

#### **For E-Wallet Payments (GCash, Maya, QR Ph):**

1. PayMongo redirect is initialized
2. User is redirected to PayMongo checkout page
3. User completes payment on PayMongo's secure page
4. On success, user is redirected back with payment details
5. Frontend calls `attachPaymentMethod()` to finalize payment

**Files:**

- `PaymentForm.jsx::initializePayMongo()`
- `PaymentController.php::attachPaymentMethod()`
- `PaymentService.php::attachPaymentMethod()`

**API Endpoint:**

```
POST /api/payments/attach-method
Body: {
  payment_intent_id: string,
  payment_method_id: string
}
```

---

### **Step 5: Payment Confirmation (Webhook)**

1. PayMongo processes the payment
2. PayMongo sends webhook event to backend:
   ```
   POST /api/payments/webhook
   Headers: {
     Paymongo-Signature: signature
   }
   Body: {
     type: 'payment_intent.succeeded',
     data: { ... }
   }
   ```
3. Backend verifies webhook signature
4. `PaymentService::processWebhook()` processes the event:
   - **`payment_intent.succeeded`**:
     - Updates payment status to `paid`
     - Sets `paid_at` timestamp
     - Stores `transaction_id`
     - Updates booking payment status
   - **`payment_intent.payment_failed`**:
     - Updates payment status to `failed`
     - Stores failure reason
   - **`payment_intent.cancelled`**:
     - Updates payment status to `cancelled`
5. Booking payment status is updated:
   - `paid` - if total paid >= total amount
   - `partial` - if total paid > 0 but < total amount
   - `unpaid` - if no payments

**Files:**

- `PaymentController.php::webhook()`
- `PaymentService.php::processWebhook()`
- `PaymentService.php::updateBookingPaymentStatus()`

**Webhook Events Handled:**

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.cancelled`
- `payment_intent.awaiting_payment_method`

---

### **Step 6: Payment Status Check**

Users can check payment status via:

1. **API Endpoint:**

   ```
   GET /api/payments/{paymentId}/status
   ```

   - Fetches latest status from PayMongo
   - Updates local payment record if status changed
   - Returns payment with booking details

2. **Booking Payments:**
   ```
   GET /api/bookings/{bookingId}/payments
   ```
   - Returns all payments for a booking
   - Ordered by creation date (newest first)

**Files:**

- `PaymentController.php::getPaymentStatus()`
- `PaymentController.php::getBookingPayments()`
- `PaymentService.php::getPaymentIntent()`

---

## 💰 Payment Methods Supported

1. **Credit/Debit Card** - Direct card entry via PayMongo form
2. **GCash** - Redirect to GCash payment
3. **Maya** - Redirect to Maya payment
4. **QR Ph** - QR code payment
5. **Bank Transfer** - Bank transfer option

---

## 📋 Payment States

### Payment Status:

- `pending` - Payment intent created, awaiting payment method
- `processing` - Payment method attached, processing
- `paid` - Payment successful
- `failed` - Payment failed
- `cancelled` - Payment cancelled
- `refunded` - Payment refunded (future feature)

### Booking Payment Status:

- `unpaid` - No payments made
- `partial` - Partial payment received
- `paid` - Fully paid

---

## 🔐 Security Features

1. **Webhook Signature Verification**

   - All webhooks are verified using HMAC SHA256
   - Prevents unauthorized webhook calls

2. **User Authorization**

   - Users can only access their own bookings/payments
   - Admins can access all bookings/payments

3. **Payment Intent Validation**

   - Amount validation
   - Booking ownership verification
   - Payment method validation

4. **Secure Payment Processing**
   - Card details never touch your server
   - Handled securely by PayMongo
   - PCI DSS compliant

---

## 📊 Database Schema

### `payments` Table:

```sql
- id (primary key)
- booking_id (foreign key)
- payment_intent_id (PayMongo ID)
- payment_method_id
- amount
- currency
- status (pending, paid, failed, cancelled)
- payment_method (card, gcash, maya, etc.)
- transaction_id
- paid_at (timestamp)
- failure_reason
- metadata (JSON)
- created_at
- updated_at
```

### `booking_details` Payment Fields:

```sql
- payment_required (boolean)
- deposit_amount (decimal)
- total_amount (decimal)
- payment_status (unpaid, partial, paid)
```

---

## 🔄 Alternative Flow: Payment Links

For invoices or manual payment requests:

1. **Create Payment Link:**

   ```
   POST /api/bookings/{bookingId}/payment-link
   Body: {
     amount: number,
     description: string (optional)
   }
   ```

2. **Response:**

   ```json
   {
     "success": true,
     "data": {
       "payment_link_id": "link_xxx",
       "checkout_url": "https://paymongo.com/checkout/xxx"
     }
   }
   ```

3. User clicks link and completes payment
4. Webhook processes payment as normal

**Files:**

- `PaymentController.php::createPaymentLink()`
- `PaymentService.php::createPaymentLink()`

---

## 🧪 Testing

### Test Cards (PayMongo Test Mode):

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

### Test E-Wallets:

- Use PayMongo test mode
- Follow PayMongo test wallet instructions

---

## 📝 Key Files Reference

### Backend:

- `app/Http/Controllers/Api/PaymentController.php` - Payment API endpoints
- `app/Services/PaymentService.php` - Payment business logic
- `app/Models/Payment.php` - Payment model
- `database/migrations/*_create_payments_table.php` - Payment table migration
- `routes/api.php` - Payment routes

### Frontend:

- `src/components/features/PaymentForm.jsx` - Payment form component
- `src/api/services/paymentService.js` - Payment API service
- `src/pages/Payment/PaymentConfirmation.jsx` - Payment confirmation page

---

## 🚀 Future Enhancements

- [ ] Refund functionality
- [ ] Payment installments/plans
- [ ] Payment reminders
- [ ] Payment receipts/invoices
- [ ] Payment analytics dashboard

---

## 📞 Support

For PayMongo issues:

- Documentation: https://developers.paymongo.com
- Support: support@paymongo.com

For application issues:

- Check logs: `storage/logs/laravel.log`
- Check browser console for frontend errors
