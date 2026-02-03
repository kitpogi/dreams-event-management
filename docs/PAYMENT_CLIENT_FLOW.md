# Payment Implementation - Client Flow Guide

**Payment Gateway:** PayMongo  
**Last Updated:** December 2024

---

## 📋 Overview

This document explains the complete payment flow from a **client/user perspective**, showing how payments are processed step-by-step in the Dreams Event Management System.

---

## 🔄 Complete Client Payment Flow

### **Phase 1: Booking Creation** 📝

```
User → Selects Package → Fills Booking Form → Creates Booking
```

**What Happens:**
1. User selects an event package
2. User fills out booking form with event details
3. Booking is created with:
   - Status: `pending`
   - Payment Status: `unpaid`
   - Total amount calculated
4. User is redirected to booking confirmation page

**Files Involved:**
- Frontend: `BookingFormModal.jsx`
- Backend: `BookingController.php`

---

### **Phase 2: Payment Initiation** 💳

```
User → Clicks "Pay Now" → PaymentForm Component Opens
```

**What Happens:**
1. User clicks "Pay Now" or "Make Payment" button on booking details
2. `PaymentForm` component is displayed
3. User sees:
   - Payment amount (in PHP)
   - Available payment methods:
     - 💳 Credit/Debit Card
     - 📱 GCash
     - 📱 Maya
     - 📷 QR Ph
     - 🏦 Bank Transfer

**User Action:** Selects preferred payment method

**Files Involved:**
- Frontend: `PaymentForm.jsx` (lines 1-239)
- Frontend: `paymentService.js` (API service)

---

### **Phase 3: Create Payment Intent** 🎯

```
User → Clicks "Continue to Payment" → Frontend → Backend → PayMongo
```

**Step-by-Step:**

1. **Frontend Request** (`PaymentForm.jsx`):
   ```javascript
   createPaymentIntent(bookingId, amount, [paymentMethod])
   ```
   - Calls: `POST /api/payments/create-intent`
   - Sends: `{ booking_id, amount, payment_methods }`

2. **Backend Processing** (`PaymentController.php`):
   - Validates request (booking exists, user owns booking, amount valid)
   - Calls `PaymentService::createPaymentIntent()`

3. **PaymentService** (`PaymentService.php`):
   - Converts amount to centavos (PHP × 100)
   - Calls PayMongo API:
     ```php
     POST https://api.paymongo.com/v1/payment_intents
     {
       amount: amount * 100,
       currency: 'PHP',
       payment_method_allowed: ['card', 'gcash', 'maya'],
       metadata: { booking_id, client_id, package_id }
     }
     ```

4. **PayMongo Response:**
   - Returns `payment_intent_id` (unique PayMongo ID)
   - Returns `client_key` (public key for frontend SDK)

5. **Backend Creates Payment Record:**
   - Saves to `payments` table with status `pending`
   - Links to booking via `booking_id`

6. **Frontend Receives:**
   ```json
   {
     "success": true,
     "data": {
       "payment_id": 123,
       "payment_intent_id": "pi_xxxxx",
       "client_key": "pk_test_xxxxx",
       "amount": 5000.00,
       "currency": "PHP"
     }
   }
   ```

**Files Involved:**
- Frontend: `PaymentForm.jsx` (lines 43-67)
- Frontend: `paymentService.js` (lines 11-22)
- Backend: `PaymentController.php` (lines 28-90)
- Backend: `PaymentService.php` (lines 27-69)

---

### **Phase 4: Payment Processing** 💰

This phase differs based on payment method:

#### **A. Card Payment Flow** 💳

```
User → Enters Card Details → PayMongo SDK → Payment Method Created → Attach to Intent
```

**Step-by-Step:**

1. **PayMongo SDK Loaded:**
   - Script loaded: `https://js.paymongo.com/v1`
   - Initialized with `client_key` and `payment_intent_id`

2. **Payment Form Mounted:**
   - PayMongo payment form appears in `#paymongo-payment-form` div
   - User enters card details (handled securely by PayMongo - PCI compliant)
   - Card details **never touch your server**

3. **User Submits Card:**
   - PayMongo validates card
   - Returns `paymentMethodId` on success

4. **Frontend Attaches Payment Method:**
   ```javascript
   attachPaymentMethod(paymentIntentId, paymentMethodId)
   ```
   - Calls: `POST /api/payments/attach-method`
   - Sends: `{ payment_intent_id, payment_method_id }`

5. **Backend Attaches Method:**
   - `PaymentService::attachPaymentMethod()` calls PayMongo
   - PayMongo processes payment
   - Payment status updated to `processing` or `paid`

**Files Involved:**
- Frontend: `PaymentForm.jsx` (lines 69-133, card flow)
- Backend: `PaymentController.php` (lines 95-141)
- Backend: `PaymentService.php` (lines 74-108)

---

#### **B. E-Wallet Payment Flow** (GCash, Maya, QR Ph) 📱

```
User → Selects E-Wallet → Redirected to PayMongo → Completes Payment → Redirected Back
```

**Step-by-Step:**

1. **User Selects E-Wallet:**
   - Chooses GCash, Maya, or QR Ph

2. **PayMongo Redirect:**
   - User redirected to PayMongo checkout page
   - Secure payment page hosted by PayMongo

3. **User Completes Payment:**
   - On PayMongo's secure page
   - Uses their e-wallet app to pay

4. **Redirect Back:**
   - PayMongo redirects to: `/bookings/payment/confirm`
   - Includes payment details in URL/state

5. **Frontend Attaches Payment Method:**
   - Same as card flow
   - Calls `attachPaymentMethod()` with returned `paymentMethodId`

**Files Involved:**
- Frontend: `PaymentForm.jsx` (lines 106-127, e-wallet flow)
- Backend: Same as card flow

---

### **Phase 5: Payment Confirmation (Webhook)** ✅

```
PayMongo → Webhook → Backend → Updates Payment Status → Updates Booking
```

**Step-by-Step:**

1. **PayMongo Processes Payment:**
   - Payment is processed by PayMongo
   - Takes a few seconds to minutes

2. **Webhook Sent:**
   - PayMongo sends webhook to: `POST /api/payments/webhook`
   - Includes signature for security verification

3. **Backend Verifies & Processes:**
   - Verifies webhook signature (HMAC SHA256)
   - `PaymentService::processWebhook()` handles event:
     - **`payment_intent.succeeded`**:
       - Updates payment status → `paid`
       - Sets `paid_at` timestamp
       - Stores `transaction_id`
       - Updates booking payment status
     - **`payment_intent.payment_failed`**:
       - Updates payment status → `failed`
       - Stores failure reason
     - **`payment_intent.cancelled`**:
       - Updates payment status → `cancelled`

4. **Booking Payment Status Updated:**
   - Calculates total paid amount
   - Updates booking:
     - `paid` - if total paid ≥ total amount
     - `partial` - if total paid > 0 but < total amount
     - `unpaid` - if no payments

**Files Involved:**
- Backend: `PaymentController.php` (lines 264-299)
- Backend: `PaymentService.php` (lines 150-208, 237-254)

---

### **Phase 6: Payment Status Check** 🔍

```
User → Views Payment Status → Frontend → Backend → PayMongo → Returns Status
```

**How Users Check Status:**

1. **Via Payment Confirmation Page:**
   - User redirected to `/payments/{paymentId}/confirm`
   - `PaymentConfirmation.jsx` component loads
   - Calls: `GET /api/payments/{paymentId}/status`

2. **Via Booking Details:**
   - User views booking details
   - Calls: `GET /api/bookings/{bookingId}/payments`
   - Shows all payments for that booking

3. **Backend Status Check:**
   - Fetches latest status from PayMongo
   - Updates local payment record if status changed
   - Returns payment with booking details

**Files Involved:**
- Frontend: `PaymentConfirmation.jsx` (lines 1-201)
- Frontend: `paymentService.js` (lines 42-61)
- Backend: `PaymentController.php` (lines 146-184, 189-212)
- Backend: `PaymentService.php` (lines 113-136)

---

## 📊 Payment States & Status

### Payment Status (in `payments` table):
- `pending` - Payment intent created, awaiting payment method
- `processing` - Payment method attached, processing
- `paid` - Payment successful ✅
- `failed` - Payment failed ❌
- `cancelled` - Payment cancelled ⚠️
- `refunded` - Payment refunded (future feature)

### Booking Payment Status (in `booking_details` table):
- `unpaid` - No payments made
- `partial` - Partial payment received (some payments made)
- `paid` - Fully paid (total paid ≥ total amount)

---

## 🔐 Security Features

1. **Webhook Signature Verification**
   - All webhooks verified using HMAC SHA256
   - Prevents unauthorized webhook calls

2. **User Authorization**
   - Users can only access their own bookings/payments
   - Admins can access all bookings/payments
   - Validated on every API call

3. **Payment Intent Validation**
   - Amount validation (server-side)
   - Booking ownership verification
   - Payment method validation

4. **Secure Payment Processing**
   - Card details never touch your server
   - Handled securely by PayMongo
   - PCI DSS compliant

---

## 🔄 Alternative Flow: Payment Links

For invoices or manual payment requests:

1. **Admin/System Creates Payment Link:**
   ```
   POST /api/bookings/{bookingId}/payment-link
   Body: { amount, description }
   ```

2. **Response:**
   ```json
   {
     "payment_link_id": "link_xxx",
     "checkout_url": "https://paymongo.com/checkout/xxx"
   }
   ```

3. **User Clicks Link:**
   - Redirected to PayMongo checkout
   - Completes payment
   - Webhook processes payment as normal

---

## 📱 User Experience Flow

### Visual Flow Diagram:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER JOURNEY                             │
└─────────────────────────────────────────────────────────────┘

1. CREATE BOOKING
   └─> User fills booking form
       └─> Booking created (status: pending, payment: unpaid)

2. INITIATE PAYMENT
   └─> User clicks "Pay Now"
       └─> PaymentForm opens
           └─> User selects payment method

3. CREATE PAYMENT INTENT
   └─> User clicks "Continue to Payment"
       └─> Frontend → Backend → PayMongo
           └─> Payment intent created
               └─> Payment record saved (status: pending)

4. PROCESS PAYMENT
   ├─> CARD: User enters card → PayMongo SDK → Payment processed
   └─> E-WALLET: User redirected → PayMongo → Payment completed

5. ATTACH PAYMENT METHOD
   └─> Frontend → Backend → PayMongo
       └─> Payment method attached
           └─> Payment status: processing

6. WEBHOOK CONFIRMATION
   └─> PayMongo → Backend (webhook)
       └─> Payment status: paid
           └─> Booking payment status updated

7. USER VIEWS STATUS
   └─> Payment confirmation page
       └─> Shows payment details and status
```

---

## 🧪 Testing the Flow

### Test Cards (PayMongo Test Mode):
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

### Testing Steps:
1. Create a test booking
2. Navigate to payment page
3. Select payment method
4. Use test card/e-wallet
5. Complete payment
6. Verify payment status updates
7. Check webhook received (check logs)

---

## 📝 Key API Endpoints

### Create Payment Intent
```
POST /api/payments/create-intent
Body: { booking_id, amount, payment_methods }
```

### Attach Payment Method
```
POST /api/payments/attach-method
Body: { payment_intent_id, payment_method_id }
```

### Get Payment Status
```
GET /api/payments/{paymentId}/status
```

### Get Booking Payments
```
GET /api/bookings/{bookingId}/payments
```

### Create Payment Link
```
POST /api/bookings/{bookingId}/payment-link
Body: { amount, description }
```

### Webhook (PayMongo → Backend)
```
POST /api/payments/webhook
Headers: { Paymongo-Signature }
```

---

## 🎯 Summary

The payment flow follows this pattern:

1. **User initiates** → Payment form opens
2. **System creates** → Payment intent with PayMongo
3. **User pays** → Via PayMongo (card or e-wallet)
4. **System attaches** → Payment method to intent
5. **PayMongo processes** → Payment in background
6. **Webhook confirms** → Payment status updated
7. **User views** → Payment confirmation page

**Key Points:**
- All sensitive card data handled by PayMongo (PCI compliant)
- Payment status updated via webhooks (asynchronous)
- Multiple payment methods supported
- Secure signature verification for webhooks
- User authorization on all endpoints

---

## 📞 Support

For questions about the payment flow:
- Check logs: `storage/logs/laravel.log` (backend)
- Check browser console (frontend)
- Review PayMongo dashboard for payment status
- Check webhook logs in PayMongo dashboard
