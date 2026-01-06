# Payment Integration Setup Guide - PayMongo

**Last Updated:** December 2024  
**Payment Gateway:** PayMongo

---

## 📋 Prerequisites

1. PayMongo account (sign up at https://paymongo.com/signup)
2. API keys from PayMongo dashboard
3. Access to backend `.env` file
4. Access to frontend `.env` file

---

## 🔧 Backend Setup

### Step 1: Install Dependencies

No additional PHP packages needed! We're using Laravel's built-in HTTP client.

### Step 2: Configure Environment Variables

Add these to your `dreams-backend/.env` file:

```env
# PayMongo Configuration
PAYMONGO_SECRET_KEY=sk_test_xxxxx  # Test key for development
PAYMONGO_PUBLIC_KEY=pk_test_xxxxx  # Test key for development
PAYMONGO_BASE_URL=https://api.paymongo.com/v1
PAYMONGO_WEBHOOK_SECRET=whsec_xxxxx  # For webhook verification

# Frontend URL (for payment redirects)
FRONTEND_URL=http://localhost:3000
```

**For Production:**

- Replace `sk_test_` with `sk_live_` (live secret key)
- Replace `pk_test_` with `pk_live_` (live public key)
- Update `FRONTEND_URL` to your production domain

### Step 3: Run Migrations

```bash
cd dreams-backend
php artisan migrate
```

This will create:

- `payments` table
- Add payment fields to `booking_details` table

### Step 4: Configure Webhook

1. Go to PayMongo Dashboard → Webhooks
2. Create a new webhook with URL: `https://yourdomain.com/api/payments/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.cancelled`
4. Copy the webhook secret and add to `.env` as `PAYMONGO_WEBHOOK_SECRET`

---

## 🎨 Frontend Setup

### Step 1: Configure Environment Variables

Add to your `dreams-frontend/.env` file:

```env
VITE_PAYMONGO_PUBLIC_KEY=pk_test_xxxxx  # Test key for development
VITE_API_BASE_URL=http://localhost:8000/api
```

**For Production:**

- Replace `pk_test_` with `pk_live_` (live public key)
- Update `VITE_API_BASE_URL` to your production API URL

### Step 2: Add Payment Route

The payment confirmation route is already added in `App.jsx`. Make sure `PaymentConfirmation` is exported from `lazyRoutes.jsx`:

```jsx
export { default as PaymentConfirmation } from "../pages/Payment/PaymentConfirmation";
```

---

## 🧪 Testing

### Test Mode

1. Use test API keys (start with `sk_test_` and `pk_test_`)
2. Test payment methods:
   - **Card:** Use test card `4242 4242 4242 4242`
   - **GCash:** Use test GCash account
   - **Maya:** Use test Maya account

### Test Cards (PayMongo)

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

### Testing Flow

1. Create a booking
2. Navigate to payment page
3. Select payment method
4. Complete test payment
5. Verify payment status updates
6. Check webhook received

---

## 📝 API Endpoints

### Create Payment Intent

```
POST /api/payments/create-intent
Body: {
  booking_id: number,
  amount: number,
  payment_methods: string[]
}
```

### Attach Payment Method

```
POST /api/payments/attach-method
Body: {
  payment_intent_id: string,
  payment_method_id: string
}
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
Body: {
  amount: number,
  description: string (optional)
}
```

### Webhook

```
POST /api/payments/webhook
```

---

## 🔐 Security Checklist

- [ ] Never commit API keys to version control
- [ ] Use environment variables for all keys
- [ ] Verify webhook signatures
- [ ] Use HTTPS in production
- [ ] Validate payment amounts server-side
- [ ] Log all payment transactions
- [ ] Monitor failed payments

---

## 🚀 Production Deployment

### Before Going Live:

1. **Switch to Live Keys**

   - Update `.env` with live keys
   - Update frontend `.env` with live public key

2. **Update Webhook URL**

   - Change webhook URL to production domain
   - Update `FRONTEND_URL` in backend `.env`

3. **Test in Production**

   - Test with small amount first
   - Verify webhook receives events
   - Test all payment methods

4. **Monitor**
   - Set up error logging
   - Monitor payment success rates
   - Track failed payments

---

## 🐛 Troubleshooting

### Payment Intent Creation Fails

- Check API keys are correct
- Verify amount is in PHP (not centavos in request)
- Check network connectivity

### Webhook Not Receiving Events

- Verify webhook URL is accessible
- Check webhook secret matches
- Verify webhook is enabled in PayMongo dashboard

### Payment Form Not Loading

- Check PayMongo JS SDK is loaded
- Verify public key is correct
- Check browser console for errors

### Payment Status Not Updating

- Check webhook is processing correctly
- Verify payment record exists in database
- Check payment service logs

---

## 📚 Additional Resources

- [PayMongo Documentation](https://developers.paymongo.com)
- [PayMongo API Reference](https://developers.paymongo.com/reference)
- [PayMongo Test Cards](https://developers.paymongo.com/docs/testing)

---

## ✅ Implementation Checklist

- [x] Payment model and migration created
- [x] PaymentService created
- [x] PaymentController created
- [x] Payment routes added
- [x] PaymentForm component created
- [x] PaymentConfirmation page created
- [x] Payment API service created
- [ ] Environment variables configured
- [ ] Migrations run
- [ ] Webhook configured
- [ ] Test payments completed
- [ ] Production keys configured
- [ ] Production webhook set up

---

**Next Steps:**

1. Configure environment variables
2. Run migrations
3. Set up webhook
4. Test payment flow
5. Deploy to production
