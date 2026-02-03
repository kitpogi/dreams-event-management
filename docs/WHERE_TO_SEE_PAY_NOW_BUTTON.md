# Where to See the "Pay Now" Button

This guide shows you **where in the application** you can see and use the "Pay Now" button.

---

## 📍 Location 1: Client Dashboard

### **URL:** `/dashboard`

### **How to Access:**
1. Log in as a **client** (not admin)
2. Navigate to: `http://your-domain.com/dashboard`
3. Or click "Dashboard" in the navigation menu

### **Where You'll See It:**

#### **A. In the Booking Cards View (List Tab)**
- The dashboard shows your bookings as **cards**
- Each booking card displays:
  - Booking details (date, venue, guests, price)
  - Payment status badge
  - **"Pay Now" button** (if payment is needed)

**Visual Location:**
```
┌─────────────────────────────────────┐
│  Booking Card                      │
│  ────────────────────────────────   │
│  Date: Jan 15, 2024                 │
│  Venue: Grand Ballroom              │
│  Guests: 100                        │
│  Price: ₱50,000.00                 │
│  Payment: [Unpaid Badge]            │
│                                     │
│  [💳 Pay Now]  ← HERE!             │
└─────────────────────────────────────┘
```

#### **B. In the Data Table View (Table Tab)**
- Switch to the **"Table" tab** in the dashboard
- The table has an **"Actions" column**
- Each row with an unpaid booking shows:
  - **"Pay Now" button** in the Actions column

**Visual Location:**
```
┌──────────┬──────────┬──────────┬──────────┐
│ Booking  │ Date     │ Amount   │ Actions  │
├──────────┼──────────┼──────────┼──────────┤
│ #123     │ Jan 15   │ ₱50,000  │ [💳 Pay  │
│          │          │          │  Now] ←  │
│          │          │          │  HERE!   │
└──────────┴──────────┴──────────┴──────────┘
```

### **Button Appearance:**
- **Color:** Purple (`#a413ec`)
- **Icon:** Credit Card icon
- **Text:** "Pay Now"
- **Size:** Small button

---

## 📍 Location 2: Booking Confirmation Page

### **URL:** `/booking-confirmation/:bookingId`

### **How to Access:**
1. After creating a new booking, you're automatically redirected here
2. Or navigate directly: `http://your-domain.com/booking-confirmation/123`
   (Replace `123` with your booking ID)

### **Where You'll See It:**

The button appears in the **Payment Summary** section of the booking confirmation page.

**Visual Location:**
```
┌─────────────────────────────────────┐
│  Booking Confirmation               │
│  ────────────────────────────────   │
│                                     │
│  Payment Summary                    │
│  ────────────────────────────────   │
│  Total Amount:    ₱50,000.00        │
│  Amount Paid:     ₱0.00             │
│  Remaining:       ₱50,000.00        │
│                                     │
│  [💳 Pay Now]  ← HERE!              │
│                                     │
│  Payment History                    │
│  ────────────────────────────────   │
└─────────────────────────────────────┘
```

### **Button Appearance:**
- **Color:** Default button style
- **Icon:** Credit Card icon
- **Text:** "Pay Now"
- **Size:** Large button
- **Width:** Full width on mobile, auto on desktop

---

## ✅ When the Button Appears

The "Pay Now" button **only shows** when **ALL** of these conditions are met:

1. ✅ **Payment is required** for the booking
2. ✅ **Booking is NOT fully paid** (status is not "paid")
3. ✅ **There's a remaining balance** (amount > 0)
4. ✅ **Booking is NOT cancelled**

### **Button Will NOT Show If:**
- ❌ Booking is already fully paid
- ❌ Booking is cancelled
- ❌ No payment is required
- ❌ Remaining balance is ₱0.00

---

## 🎯 Step-by-Step: How to See the Button

### **Method 1: From Dashboard**

1. **Log in** to your account
   ```
   http://your-domain.com/login
   ```

2. **Go to Dashboard**
   ```
   http://your-domain.com/dashboard
   ```
   Or click "Dashboard" in the navigation

3. **Find Your Booking**
   - Look for bookings with payment status: **"Unpaid"** or **"Partial"**
   - The button appears below the booking details

4. **Click "Pay Now"**
   - Button opens the payment modal
   - Select payment method
   - Complete payment

### **Method 2: From Booking Confirmation**

1. **Create a New Booking**
   - Go to a package page
   - Click "Book Now"
   - Fill out booking form
   - Submit booking

2. **You're Redirected to Confirmation Page**
   ```
   /booking-confirmation/:bookingId
   ```

3. **See Payment Summary Section**
   - Scroll to "Payment Summary"
   - See "Pay Now" button if payment is needed

4. **Click "Pay Now"**
   - Opens payment modal
   - Complete payment

---

## 🔍 Visual Guide

### **Dashboard View:**
```
┌─────────────────────────────────────────────┐
│  Client Dashboard                            │
│  ─────────────────────────────────────────   │
│                                              │
│  [List] [Table] [Calendar]  ← Tabs          │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ Booking #123                         │    │
│  │ ──────────────────────────────────── │    │
│  │ Date: Jan 15, 2024                   │    │
│  │ Venue: Grand Ballroom                │    │
│  │ Guests: 100                           │    │
│  │ Price: ₱50,000.00                    │    │
│  │ Payment: [Unpaid]                    │    │
│  │                                       │    │
│  │ [💳 Pay Now]  ← BUTTON HERE          │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ Booking #124                         │    │
│  │ ... (another booking)                │    │
│  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### **Booking Confirmation View:**
```
┌─────────────────────────────────────────────┐
│  Booking Confirmation                       │
│  ─────────────────────────────────────────   │
│                                              │
│  ✅ Booking Confirmed!                       │
│                                              │
│  Booking Details:                           │
│  ─────────────────────────────────────────   │
│  Booking ID: #123                            │
│  Package: Premium Package                    │
│  Date: January 15, 2024                     │
│  ...                                         │
│                                              │
│  Payment Summary:                            │
│  ─────────────────────────────────────────   │
│  Total Amount:    ₱50,000.00                 │
│  Amount Paid:     ₱0.00                      │
│  Remaining:       ₱50,000.00                 │
│                                              │
│  [💳 Pay Now]  ← BUTTON HERE                │
│                                              │
│  Payment History:                            │
│  ─────────────────────────────────────────   │
│  (No payments yet)                           │
└─────────────────────────────────────────────┘
```

---

## 🚀 Quick Access URLs

### **Dashboard:**
```
http://localhost:5173/dashboard
```
or
```
http://your-domain.com/dashboard
```

### **Booking Confirmation:**
```
http://localhost:5173/booking-confirmation/123
```
(Replace `123` with your actual booking ID)

---

## 💡 Tips

1. **If you don't see the button:**
   - Check if booking is already paid
   - Check if booking is cancelled
   - Check if payment is required

2. **Button color:**
   - Purple button = Client Dashboard
   - Default button = Booking Confirmation

3. **After clicking:**
   - Payment modal opens
   - Select payment method (Card, GCash, Maya, etc.)
   - Complete payment

---

## 📱 Mobile View

On mobile devices:
- Button is **full width** on Booking Confirmation page
- Button is **smaller** on Dashboard (fits in card/table)
- Same functionality on all devices

---

## 🎯 Summary

**You can see "Pay Now" button in:**

1. ✅ **Client Dashboard** (`/dashboard`)
   - In booking cards (List view)
   - In table actions column (Table view)

2. ✅ **Booking Confirmation** (`/booking-confirmation/:bookingId`)
   - In Payment Summary section

**Button shows when:**
- Payment is required
- Booking is not fully paid
- There's a remaining balance
- Booking is not cancelled

**Button does NOT show when:**
- Already fully paid
- Booking is cancelled
- No payment required
