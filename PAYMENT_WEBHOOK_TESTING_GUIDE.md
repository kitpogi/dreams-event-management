# Payment Webhook Testing Guide

**Date:** December 2024  
**Status:** Ready for Testing

---

## 🚀 Prerequisites

Before testing, make sure you have:

1. ✅ **Laravel Backend Running**

   ```bash
   cd dreams-backend
   php artisan serve
   ```

   Should be running on `http://localhost:8000`

2. ✅ **Frontend Running**

   ```bash
   cd dreams-frontend
   npm run dev
   ```

   Should be running on `http://localhost:5173` (or port 3000)

3. ✅ **ngrok Running**

   ```bash
   ngrok http 8000
   ```

   Keep this running - it exposes your local server to PayMongo

4. ✅ **Webhook Configured in PayMongo**

   - Endpoint: `https://your-ngrok-url.ngrok-free.dev/api/payments/webhook`
   - Events: `payment.paid` and `payment.failed` checked
   - Webhook secret added to `.env` file

5. ✅ **Environment Variables Set**
   - `PAYMONGO_SECRET_KEY` - Test secret key
   - `PAYMONGO_PUBLIC_KEY` - Test public key
   - `PAYMONGO_WEBHOOK_SECRET` - Webhook signing secret

---

## 🧪 Testing Steps

### Step 1: Verify Setup

1. **Check ngrok is forwarding correctly:**

   - Visit: http://127.0.0.1:4040
   - You should see the ngrok web interface
   - Note your public URL (e.g., `https://abc123.ngrok-free.dev`)

2. **Verify webhook endpoint is accessible:**
   - In ngrok web interface, you should see requests to `/api/payments/webhook`
   - Or test manually (optional):
     ```bash
     curl -X POST https://your-ngrok-url.ngrok-free.dev/api/payments/webhook \
       -H "Content-Type: application/json" \
       -d '{"test": "data"}'
     ```

### Step 2: Create a Test Booking

1. **Login to your application**

   - Go to `http://localhost:5173` (or your frontend URL)
   - Login as a client/user

2. **Create a booking:**
   - Navigate to packages
   - Select a package
   - Fill out booking form
   - Create booking
   - **Note the booking ID** (you'll need it)

### Step 3: Test Payment Flow

1. **Navigate to Payment:**

   - Go to booking details page
   - Click "Pay Now" or "Make Payment" button
   - PaymentForm should appear

2. **Select Payment Method:**

   - Choose "Credit/Debit Card" (easiest to test)

3. **Create Payment Intent:**

   - Click "Continue to Payment"
   - Payment intent should be created
   - PayMongo payment form should appear

4. **Complete Test Payment:**
   - **Card Number:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g., `12/25`)
   - **CVC:** Any 3 digits (e.g., `123`)
   - **ZIP Code:** Any 5 digits (e.g., `12345`)
   - Click "Pay" or "Submit"

### Step 4: Monitor Webhook Delivery

1. **Check ngrok Web Interface:**

   - Open: http://127.0.0.1:4040
   - Click on the webhook request
   - You should see:
     - Request from PayMongo
     - Request body (webhook payload)
     - Response from your server

2. **Check PayMongo Dashboard:**
   - Go to: https://dashboard.paymongo.com
   - Navigate to **Webhooks** → Your webhook
   - Check **Webhook Logs**
   - You should see:
     - ✅ Success (200 response) - Webhook delivered successfully
     - ❌ Failed - Check error message

### Step 5: Verify Payment Processing

1. **Check Laravel Logs:**

   ```bash
   # In dreams-backend directory
   tail -f storage/logs/laravel.log
   ```

   Look for:

   - Webhook received messages
   - Payment processing logs
   - Any errors

2. **Check Database:**

   ```sql
   -- Check payments table
   SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;

   -- Check booking payment status
   SELECT booking_id, payment_status, total_amount
   FROM booking_details
   WHERE booking_id = 'YOUR_BOOKING_ID';
   ```

3. **Check Payment Status via API:**
   ```bash
   # Get payment status
   curl -X GET http://localhost:8000/api/payments/{paymentId}/status \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## 🎯 Test Scenarios

### Scenario 1: Successful Payment

**Expected Result:**

- ✅ Payment status: `paid`
- ✅ Booking payment_status: `paid` (if full amount) or `partial`
- ✅ Webhook received and processed
- ✅ Payment record created in database
- ✅ `paid_at` timestamp set

**Test Card:** `4242 4242 4242 4242`

### Scenario 2: Failed Payment

**Expected Result:**

- ✅ Payment status: `failed`
- ✅ `failure_reason` field populated
- ✅ Webhook received with failure event
- ✅ Booking payment_status remains `unpaid`

**Test Card:** `4000 0000 0000 0002` (declined card)

### Scenario 3: Webhook Signature Verification

**Test:**

- Try sending a webhook with invalid signature
- Should return 401 Unauthorized
- Check logs for "Invalid webhook signature" warning

---

## 🔍 Debugging

### Webhook Not Received

1. **Check ngrok is running:**

   ```bash
   # Should show active tunnel
   ngrok http 8000
   ```

2. **Verify webhook URL in PayMongo:**

   - Must match your current ngrok URL
   - Must include `/api/payments/webhook`
   - Must be HTTPS

3. **Check Laravel server is running:**

   ```bash
   php artisan serve
   ```

4. **Check CORS settings:**
   - Verify `CORS_ALLOWED_ORIGINS` in `.env`
   - Check `config/cors.php`

### Webhook Received But Not Processed

1. **Check webhook secret:**

   ```bash
   # In .env file
   PAYMONGO_WEBHOOK_SECRET=whsk_vJV6QBtLTFhTgNTvwmxAEfLT
   ```

   - Must match PayMongo webhook secret exactly
   - No extra spaces or quotes

2. **Check Laravel logs:**

   ```bash
   tail -f storage/logs/laravel.log
   ```

   Look for:

   - "Invalid webhook signature"
   - "Payment not found"
   - "Invalid webhook event data"

3. **Check payment intent ID:**
   - Webhook must include valid `payment_intent_id`
   - Payment record must exist in database

### Payment Status Not Updating

1. **Check webhook event type:**

   - Your code handles: `payment_intent.succeeded`, `payment_intent.payment_failed`, etc.
   - PayMongo might send: `payment.paid`, `payment.failed`
   - Check if PayMongo sends both event types

2. **Check database:**

   ```sql
   SELECT * FROM payments WHERE payment_intent_id = 'YOUR_INTENT_ID';
   ```

3. **Manually trigger webhook processing:**
   - Check PayMongo dashboard for webhook retry option
   - Or manually call webhook endpoint with test payload

---

## 📊 Monitoring Tools

### 1. ngrok Web Interface

- **URL:** http://127.0.0.1:4040
- **Shows:** All HTTP requests, request/response bodies, headers

### 2. PayMongo Dashboard

- **URL:** https://dashboard.paymongo.com
- **Shows:** Webhook delivery status, logs, retry attempts

### 3. Laravel Logs

- **Location:** `dreams-backend/storage/logs/laravel.log`
- **Shows:** Application logs, errors, webhook processing

### 4. Browser Console

- **Shows:** Frontend errors, API calls, payment form issues

---

## ✅ Success Checklist

After testing, verify:

- [ ] Payment intent can be created
- [ ] Payment form loads correctly
- [ ] Test card payment succeeds
- [ ] Webhook is received by your server
- [ ] Webhook signature is verified
- [ ] Payment status updates in database
- [ ] Booking payment_status updates correctly
- [ ] Payment record is created with correct data
- [ ] No errors in Laravel logs
- [ ] No errors in browser console

---

## 🚨 Common Issues & Solutions

### Issue: "Invalid webhook signature"

**Solution:**

- Verify `PAYMONGO_WEBHOOK_SECRET` matches PayMongo dashboard
- Check for extra spaces or quotes in `.env`
- Restart Laravel server after updating `.env`

### Issue: "Payment not found"

**Solution:**

- Verify payment record exists in database
- Check `payment_intent_id` matches webhook payload
- Ensure payment was created before webhook arrives

### Issue: "Webhook not received"

**Solution:**

- Verify ngrok is running and URL is correct
- Check webhook URL in PayMongo matches ngrok URL
- Ensure Laravel server is running
- Check firewall/antivirus isn't blocking ngrok

### Issue: "Payment status not updating"

**Solution:**

- Check webhook event type matches your code
- Verify webhook is being processed (check logs)
- Check database for payment record
- Verify booking relationship exists

---

## 🎓 Next Steps

After successful testing:

1. ✅ Test with different payment methods (GCash, Maya)
2. ✅ Test payment failures and cancellations
3. ✅ Test partial payments
4. ✅ Test refunds (if implemented)
5. ✅ Set up production webhook with live domain
6. ✅ Switch to live API keys for production

---

## 📞 Need Help?

- **PayMongo Support:** support@paymongo.com
- **PayMongo Docs:** https://developers.paymongo.com
- **Test Cards:** https://developers.paymongo.com/docs/testing
- **Webhook Guide:** https://developers.paymongo.com/docs/webhooks

---

**Last Updated:** December 2024
