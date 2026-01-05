# Payment Gateway Recommendations for Philippines

**Last Updated:** December 2024  
**Target Market:** Philippines

---

## 🏆 Top Recommendations

### 1. **PayMongo** ⭐ **BEST CHOICE FOR PHILIPPINES**

**Why Choose PayMongo:**

- ✅ **Philippine-based** - Local company with excellent local support
- ✅ **Developer-friendly** - Clean API, good documentation
- ✅ **Multiple payment methods** - Cards, GCash, Maya, QR Ph, OTC payments
- ✅ **Easy integration** - Well-documented Laravel/PHP SDK
- ✅ **Affordable fees** - Competitive pricing for local businesses
- ✅ **Payment Links** - Easy to generate payment links for invoices
- ✅ **Webhook support** - Real-time payment notifications

**Supported Payment Methods:**

- Credit/Debit Cards (Visa, Mastercard, JCB)
- GCash
- Maya (formerly PayMaya)
- QR Ph (Philippine QR Code Standard)
- Over-the-counter payments (7-Eleven, Bayad Center, etc.)
- Bank transfers

**Integration:**

- Official Laravel package available
- RESTful API
- Webhook support for payment confirmations
- Good documentation and community support

**Fees:**

- Card payments: ~3.5% + ₱15 per transaction
- E-wallet (GCash/Maya): ~2.5% + ₱15 per transaction
- OTC payments: ~₱15 per transaction

**Best For:**

- Local Philippine businesses
- Startups and SMEs
- Event management systems
- E-commerce platforms

---

### 2. **Xendit** ⭐ **BEST FOR SCALABILITY**

**Why Choose Xendit:**

- ✅ **Southeast Asia coverage** - Works across multiple countries
- ✅ **Scalable** - Handles high transaction volumes
- ✅ **Multiple payment methods** - Cards, e-wallets, bank payments
- ✅ **Reliable** - Used by major tech companies
- ✅ **Good API** - Well-documented REST API
- ✅ **Recurring payments** - Support for subscriptions

**Supported Payment Methods:**

- Credit/Debit Cards
- GCash
- Maya
- Bank transfers (BDO, BPI, Metrobank, etc.)
- Virtual accounts
- Retail outlets (7-Eleven, etc.)

**Integration:**

- RESTful API
- Webhook support
- Good documentation
- Multiple SDKs available

**Fees:**

- Card payments: ~3.5% + ₱15 per transaction
- E-wallet: ~2.5% + ₱15 per transaction
- Bank transfers: ~₱15 per transaction

**Best For:**

- Growing businesses
- Multi-country operations
- High transaction volumes
- Tech companies

---

### 3. **Maya (PayMaya)**

**Why Choose Maya:**

- ✅ **Comprehensive platform** - E-wallet + payment gateway
- ✅ **Wide adoption** - Many Filipinos already use Maya
- ✅ **QR payments** - Easy QR code payments
- ✅ **Invoicing** - Built-in invoicing features
- ✅ **Business tools** - Additional business management features

**Supported Payment Methods:**

- Maya wallet
- Credit/Debit Cards
- QR payments
- Bank transfers

**Best For:**

- Businesses wanting all-in-one solution
- Retail businesses
- Businesses with existing Maya accounts

---

### 4. **Dragonpay**

**Why Choose Dragonpay:**

- ✅ **Well-established** - Operating since 2010
- ✅ **Many payment options** - Supports traditional payment methods
- ✅ **Bank partnerships** - Direct bank integrations
- ✅ **OTC payments** - Extensive over-the-counter network

**Supported Payment Methods:**

- Bank transfers (all major banks)
- E-wallets (GCash, Maya)
- Over-the-counter (7-Eleven, Bayad Center, etc.)
- Credit/Debit Cards

**Best For:**

- Businesses targeting customers who prefer traditional payments
- Businesses needing extensive OTC payment options
- Established businesses

---

## 📊 Comparison Table

| Feature                 | PayMongo   | Xendit     | Maya     | Dragonpay  |
| ----------------------- | ---------- | ---------- | -------- | ---------- |
| **Local Support**       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐⭐ | ⭐⭐⭐⭐   |
| **Ease of Integration** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐   | ⭐⭐⭐     |
| **Payment Methods**     | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Documentation**       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐   | ⭐⭐⭐     |
| **Fees**                | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   | ⭐⭐⭐   | ⭐⭐⭐     |
| **Scalability**         | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐   | ⭐⭐⭐     |
| **GCash Support**       | ✅         | ✅         | ✅       | ✅         |
| **Maya Support**        | ✅         | ✅         | ✅       | ✅         |
| **QR Payments**         | ✅         | ✅         | ✅       | ❌         |
| **OTC Payments**        | ✅         | ✅         | ❌       | ✅         |

---

## 🎯 Recommendation for Dreams Event Management System

### **Primary Choice: PayMongo**

**Reasons:**

1. **Local Support** - Philippine-based company, understands local market
2. **Developer-Friendly** - Easy to integrate with Laravel
3. **Complete Payment Options** - Supports all major payment methods Filipinos use
4. **Good Documentation** - Easy to implement and maintain
5. **Affordable** - Competitive fees for local businesses
6. **Payment Links** - Perfect for sending invoice payment links via email

### **Alternative: Xendit**

**Consider if:**

- You plan to expand to other Southeast Asian countries
- You need to handle very high transaction volumes
- You want more advanced features (recurring payments, etc.)

---

## 💻 Implementation Guide

### For PayMongo (Recommended)

#### Backend (Laravel)

1. **Install PayMongo Package:**

```bash
composer require paymongo/paymongo-php
```

2. **Add to .env:**

```env
PAYMONGO_SECRET_KEY=sk_test_xxxxx
PAYMONGO_PUBLIC_KEY=pk_test_xxxxx
```

3. **Create Payment Model:**

```php
// Migration
Schema::create('payments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('booking_id')->constrained('booking_details');
    $table->string('payment_intent_id')->unique();
    $table->decimal('amount', 10, 2);
    $table->string('currency')->default('PHP');
    $table->string('payment_method'); // card, gcash, maya, etc.
    $table->string('status'); // pending, paid, failed, refunded
    $table->json('metadata')->nullable();
    $table->timestamps();
});
```

4. **Payment Controller Example:**

```php
use Paymongo\PaymongoClient;

public function createPayment(Request $request)
{
    $client = new PaymongoClient(env('PAYMONGO_SECRET_KEY'));

    // Create payment intent
    $paymentIntent = $client->paymentIntents->create([
        'amount' => $request->amount * 100, // Convert to centavos
        'currency' => 'PHP',
        'payment_method_allowed' => ['card', 'gcash', 'maya'],
        'metadata' => [
            'booking_id' => $request->booking_id,
        ],
    ]);

    // Store payment record
    Payment::create([
        'booking_id' => $request->booking_id,
        'payment_intent_id' => $paymentIntent->id,
        'amount' => $request->amount,
        'status' => 'pending',
    ]);

    return response()->json([
        'client_key' => $paymentIntent->client_key,
        'payment_intent_id' => $paymentIntent->id,
    ]);
}
```

#### Frontend (React)

1. **Install PayMongo JS:**

```bash
npm install @paymongo/react-paymongo
```

2. **Payment Component:**

```jsx
import { PaymongoProvider, PaymentForm } from "@paymongo/react-paymongo";

function PaymentPage() {
  return (
    <PaymongoProvider publicKey={import.meta.env.VITE_PAYMONGO_PUBLIC_KEY}>
      <PaymentForm
        paymentIntentId={paymentIntentId}
        onSuccess={(payment) => {
          // Handle successful payment
          console.log("Payment successful:", payment);
        }}
        onError={(error) => {
          // Handle error
          console.error("Payment error:", error);
        }}
      />
    </PaymongoProvider>
  );
}
```

---

## 🔐 Security Best Practices

1. **Never expose secret keys** - Keep secret keys in backend only
2. **Use webhooks** - Verify payments via webhooks, not just client-side
3. **Validate amounts** - Always validate payment amounts server-side
4. **HTTPS only** - Always use HTTPS in production
5. **Webhook verification** - Verify webhook signatures from payment gateway

---

## 📱 Payment Methods Priority for Philippines

1. **GCash** - Most popular e-wallet (highest priority)
2. **Maya** - Second most popular e-wallet
3. **Credit/Debit Cards** - For customers with cards
4. **QR Ph** - Growing in popularity
5. **Bank Transfer** - For large amounts
6. **OTC Payments** - For customers without bank accounts

---

## 📞 Getting Started

### PayMongo

- Website: https://paymongo.com
- Documentation: https://developers.paymongo.com
- Sign up: https://paymongo.com/signup
- Support: support@paymongo.com

### Xendit

- Website: https://www.xendit.co
- Documentation: https://docs.xendit.co
- Sign up: https://dashboard.xendit.co/register
- Support: support@xendit.co

---

## ✅ Checklist for Implementation

- [ ] Choose payment gateway (recommend PayMongo)
- [ ] Create account and get API keys
- [ ] Install SDK/package
- [ ] Set up webhook endpoint
- [ ] Create Payment model and migration
- [ ] Implement payment creation endpoint
- [ ] Implement webhook handler
- [ ] Create payment UI components
- [ ] Test with test/sandbox mode
- [ ] Test all payment methods (GCash, Maya, Cards)
- [ ] Set up production keys
- [ ] Monitor transactions

---

## 🎯 Next Steps

1. **Sign up for PayMongo account** (recommended)
2. **Get API keys** (test keys first)
3. **Start with test mode** - Test all payment methods
4. **Implement backend** - Payment creation and webhook handling
5. **Implement frontend** - Payment form and confirmation
6. **Test thoroughly** - Test all payment methods
7. **Go live** - Switch to production keys

---

**Recommendation:** Start with **PayMongo** for the best local support and easiest integration. You can always add Xendit later if you need additional features or expand to other countries.
