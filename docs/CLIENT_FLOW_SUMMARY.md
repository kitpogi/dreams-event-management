# Client User Flow - Quick Summary

## 🚀 Main Entry Points

```
┌─────────────────────────────────────────────────────────────┐
│                    D'Dreams Events Homepage                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌─────────┐        ┌──────────┐       ┌──────────┐
   │Packages │        │Set An    │       │Contact   │
   │         │        │Event     │       │Us        │
   └─────────┘        └──────────┘       └──────────┘
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   │
   ┌─────────┐        ┌──────────────┐         │
   │Package  │        │Recommendations│         │
   │Details  │        │Page          │         │
   └─────────┘        └──────────────┘         │
        │                   │                   │
        │                   │                   │
        └───────────┬───────┴───────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  Contact Us   │
            │  (Inquiry)    │
            └───────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   Admin       │
            │   Reviews     │
            └───────────────┘
```

## 📋 Detailed Flow Paths

### Path 1: Browse & Inquire
```
Home → Packages → Package Details → Inquire Rates → Contact Us → Inquiry Submitted
```

### Path 2: Get Recommendations
```
Home → Set An Event → Fill Form → Submit → Recommendations Page → 
  ├─> View Details → Package Details
  ├─> Contact Us → Contact Form (pre-filled)
  └─> Book Now → Login → Booking Form
```

### Path 3: Direct Booking (Authenticated)
```
Home → Login → Packages → Package Details → Book Now → Booking Form → Submit
```

### Path 4: Quick Contact
```
Home → Contact Us → Fill Form → Submit → Inquiry Saved
```

## 🔐 Authentication States

### Without Account:
- ✅ Browse packages
- ✅ View package details
- ✅ Get recommendations
- ✅ Submit inquiries
- ❌ Book packages directly
- ❌ View dashboard
- ❌ Submit testimonials

### With Account (Logged In):
- ✅ All above features PLUS:
- ✅ Book packages directly
- ✅ View dashboard
- ✅ Track bookings
- ✅ Submit testimonials

## 📊 Booking Status Journey

```
┌─────────┐
│ Pending │  ← Client submits booking
└────┬────┘
     │
     ▼
┌──────────┐
│ Approved │  ← Admin approves
└────┬─────┘
     │
     ▼
┌───────────┐
│ Completed │  ← Event completed
└────┬──────┘
     │
     ▼
┌──────────────┐
│ Testimonial  │  ← Client can submit review
│ Submission   │
└──────────────┘
```

## 🎯 Key Actions Available

### On Package Cards:
1. **Click Image** → View Package Details
2. **Inquire Rates** → Go to Contact Us
3. **View Details** → See full package info

### On Recommendations Page:
1. **View Details** → Package Details page
2. **Contact Us** → Contact form (pre-filled)
3. **Book Now** → Booking form (if logged in)
4. **Login to Book** → Login page (if not logged in)

### On Package Details:
1. **Inquire Rates** → Contact Us page
2. **Book Now** → Booking form (if logged in)

### In Client Dashboard:
1. **View Bookings** → See all bookings with status
2. **Submit Testimonial** → Share experience (if booking completed)

## 📝 Form Types

### 1. Set An Event Form
- Personal info
- Event details
- Budget & guests
- Motifs/theme
- **Result**: Recommendations + Contact Inquiry

### 2. Contact Us Form
- Personal info
- Event details
- Budget & guests
- Message
- **Result**: Contact Inquiry

### 3. Booking Form (Authenticated)
- Package info (pre-filled)
- Event date & time
- Guest count
- Special requirements
- **Result**: Booking (Pending status)

### 4. Recommendation Form
- Event type
- Budget
- Guests
- Theme
- Preferences
- **Result**: Recommendations only

### 5. Testimonial Form
- Select booking
- Rating
- Message
- Avatar (optional)
- **Result**: Testimonial (Pending moderation)

## 🎨 Visual User Journey

```
┌──────────────────────────────────────────────────────────────┐
│                    CLIENT USER JOURNEY                        │
└──────────────────────────────────────────────────────────────┘

DISCOVERY PHASE
├─> Browse homepage
├─> View packages
├─> Check portfolio
└─> Read testimonials

INQUIRY PHASE
├─> Option A: Set An Event → Get Recommendations
├─> Option B: Contact Us directly
├─> Option C: Browse → Package Details → Inquire
└─> Option D: Get Recommendations via form

DECISION PHASE
├─> View recommendations
├─> Filter & sort packages
├─> Compare options
└─> Select preferred package

ACTION PHASE
├─> Contact Us (if not ready to book)
└─> Book Now (if ready, requires login)

MANAGEMENT PHASE (After Login)
├─> View dashboard
├─> Track booking status
└─> Submit testimonial (after event)

```

## 🔄 Complete Cycle

```
Start → Discover → Inquire → Decide → Book → Manage → Review → End
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
                    (Can repeat for future events)
```

## 💡 Quick Tips

1. **New to the system?** → Start with "Set An Event" for personalized recommendations
2. **Know what you want?** → Browse packages and book directly
3. **Have questions?** → Use Contact Us for direct inquiry
4. **Want to track?** → Create account and login
5. **After your event?** → Submit a testimonial to help others

---

**All inquiries and bookings are automatically saved and can be viewed by admins in the admin panel.**

