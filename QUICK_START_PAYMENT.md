# Quick Start: Payment Integration Setup

**Time Required:** 10-15 minutes  
**Difficulty:** Easy

---

## 🚀 Step-by-Step Setup

### Step 1: Get PayMongo API Keys (5 minutes)

1. **Sign up for PayMongo:**

   - Go to https://paymongo.com/signup
   - Create your account (it's free!)

2. **Get API Keys:**

   - Login to https://dashboard.paymongo.com
   - Go to **Developers** → **API Keys**
   - Copy your **Test Secret Key** (starts with `sk_test_`)
   - Copy your **Test Public Key** (starts with `pk_test_`)

3. **Update `.env` files:**
   - Open `dreams-backend/.env`
   - Replace `PAYMONGO_SECRET_KEY=sk_test_xxxxx` with your actual secret key
   - Replace `PAYMONGO_PUBLIC_KEY=pk_test_xxxxx` with your actual public key
   - Open `dreams-frontend/.env`
   - Replace `VITE_PAYMONGO_PUBLIC_KEY=pk_test_xxxxx` with your actual public key

---

### Step 2: Run Database Migrations (1 minute)

Open terminal in `dreams-backend` folder and run:

```bash
cd dreams-backend
php artisan migrate
```

This will create:

- ✅ `payments` table
- ✅ Payment fields in `booking_details` table

---

### Step 3: Test the Setup (5 minutes)

1. **Start your servers:**

   ```bash
   # Terminal 1 - Backend
   cd dreams-backend
   php artisan serve

   # Terminal 2 - Frontend
   cd dreams-frontend
   npm run dev
   ```

2. **Test Payment Intent Creation:**

   - Create a booking in your system
   - Navigate to payment page
   - Try creating a payment intent

3. **Test with Test Card:**
   - Use card number: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

---

### Step 4: Set Up Webhook (Optional for Testing)

**For Local Testing:**

- Use ngrok or similar tool to expose your local server
- Or test webhooks later in production

**For Production:**

1. Go to PayMongo Dashboard → **Webhooks**
2. Create webhook with URL: `https://yourdomain.com/api/payments/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.cancelled`
4. Copy webhook secret and add to `dreams-backend/.env` as `PAYMONGO_WEBHOOK_SECRET`

---

## ✅ Verification Checklist

- [ ] PayMongo account created
- [ ] API keys added to `.env` files
- [ ] Migrations run successfully
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Payment intent can be created
- [ ] Test payment works

---

## 🧪 Test Payment Flow

1. **Create a Booking:**

   - Login to your system
   - Create a new booking
   - Note the booking ID

2. **Initiate Payment:**

   - Go to booking details
   - Click "Pay Now" or similar button
   - Select payment method
   - Enter test card: `4242 4242 4242 4242`
   - Complete payment

3. **Verify:**
   - Check payment status in database
   - Check booking payment status updated
   - View payment in PayMongo dashboard

---

## 🐛 Common Issues

### "Invalid API Key" Error

- ✅ Check keys are copied correctly (no extra spaces)
- ✅ Verify you're using test keys (start with `sk_test_` / `pk_test_`)
- ✅ Make sure keys are in the correct `.env` files

### "Migration Failed" Error

- ✅ Check database connection in `.env`
- ✅ Make sure database exists
- ✅ Check you have proper permissions

### "Payment Form Not Loading"

- ✅ Check browser console for errors
- ✅ Verify `VITE_PAYMONGO_PUBLIC_KEY` is set in frontend `.env`
- ✅ Restart frontend server after updating `.env`

---

## 📞 Need Help?

- **PayMongo Support:** support@paymongo.com
- **PayMongo Docs:** https://developers.paymongo.com
- **Test Cards:** https://developers.paymongo.com/docs/testing

---

## 🎯 Next Steps After Setup

1. ✅ Test all payment methods (Card, GCash, Maya)
2. ✅ Integrate payment button into booking flow
3. ✅ Add payment status display to booking details
4. ✅ Set up webhook for production
5. ✅ Test with real payments (small amounts first)

---

**You're all set!** 🎉 Start testing your payment integration now.
