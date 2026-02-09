# PayMongo Integration & Deployment Guide

This document outlines the current state of the PayMongo payment integration for the Dreams Event Management System and the steps required to move from testing to a live production environment.

## 1. Current Environment: Test Mode
Currently, the system is configured in **PayMongo Test Mode**. 
- **API Keys:** Uses `pk_test_...` and `sk_test_...` in your `.env` file.
- **Transactions:** No real money is moved. 
- **Testing:** Use PayMongo's [official test credentials](https://developers.paymongo.com/docs/testing) (Test Cards, Test GCash/Maya numbers) to verify the checkout flow.

---

## 2. Moving to Production (Live Mode)
When you are ready to deploy your website on a public domain, follow these steps:

### Step 1: Create a PayMongo Business Account
1. Sign up at [PayMongo.com](https://www.paymongo.com/).
2. Complete the onboarding process. You will need to submit:
   - DTI/SEC registration
   - Mayor's Permit
   - BIR Certificate of Registration (Form 2303)
   - Valid Government ID of the owner/representative

### Step 2: Update API Keys
Once your account is approved, PayMongo will provide **Live Keys**. Update your production environment variables (`.env`):
```env
PAYMONGO_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxx
PAYMONGO_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
```

### Step 3: Webhook Setup
For automatic payment updates (marking bookings as "Paid" automatically), you must configure your Live Webhook in the PayMongo Dashboard:
- **Webhook URL:** `https://yourdomain.com/api/payment/webhook`
- **Events to listen for:** `payment_intent.succeeded`

---

## 3. Pricing & Fees
PayMongo does not charge monthly or setup fees. They only take a percentage of successful transactions:

| Payment Method | PayMongo Processing Fee |
| :--- | :--- |
| **E-Wallets (GCash, Maya, GrabPay)** | **2.9%** per transaction |
| **Credit/Debit Cards (Visa/Mastercard)** | **3.5% + ₱15.00** per transaction |
| **Over-the-Counter / BillEase** | **₱15.00 - ₱20.00** flat fee |

*Note: Fees are deducted automatically. If a client pays ₱1,000 via GCash, you will receive ₱971.00 in your PayMongo balance.*

---

## 4. System Benefits
- **Automated Workflow:** The system automatically approves bookings or sends receipts once payment is confirmed via webhook.
- **Enhanced Security:** No sensitive payment data stores on your database; everything is handled by PayMongo's PCI-compliant servers.
- **Improved Trust:** Offering official checkout methods (Gcash/Maya) increases customer confidence compared to manual bank transfers.

---

## 5. Helpful Links
- [PayMongo Developer Documentation](https://developers.paymongo.com/)
- [Testing Credentials Guide](https://developers.paymongo.com/docs/testing)
- [Transaction Fee Calculator](https://www.paymongo.com/pricing)
