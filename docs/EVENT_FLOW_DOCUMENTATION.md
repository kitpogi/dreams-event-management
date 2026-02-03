# Event Flow Documentation - Set An Event

## Overview

This document outlines the complete event flow for the "Set An Event" feature, including all possible user paths and scenarios, especially when clients don't find suitable packages in the recommendations.

---

## 🎯 Complete Event Flow

### **Main Flow Path**

```
Step 1: Fill Event Form
  ↓
  [Contact Inquiry Auto-Created in Backend]
  ↓
Step 2: View Recommendations
  ↓
Step 3: Select Package & Complete Booking
  ↓
Booking Confirmation Page
```

---

## 📋 Step-by-Step Flow Details

### **Step 1: Fill Event Form**

**Purpose:** Collect client information and event requirements

**Form Fields:**
- **Personal Information:**
  - First Name *
  - Last Name *
  - Email Address *
  - Phone Number *

- **Event Details:**
  - Event Date *
  - Event Time *
  - Venue *
  - Event Type * (Wedding, Birthday, Debut, etc.)
  - Motifs/Theme (Max 3 selections) *

- **Guest and Budget:**
  - Number of Guests *
  - Budget Range *

**What Happens:**
1. User fills out the form with all required fields
2. Form validates all inputs
3. On submission, data is sent to `/api/recommend` endpoint
4. **Contact Inquiry is automatically created** in the backend (even if no booking is made)
5. System generates personalized package recommendations
6. User moves to Step 2

**Backend Actions:**
- Creates contact inquiry record
- Scores and ranks packages based on criteria
- Returns top matching packages

---

### **Step 2: View Recommendations**

**Purpose:** Display personalized package recommendations

**What User Sees:**
- Grid of recommended packages with match scores
- Filter options (price, budget range)
- Sort options (match score, price low to high, price high to low)
- Package cards showing:
  - Package name and image
  - Match score percentage
  - Price
  - Capacity
  - Match justification

**User Actions:**
1. Browse recommendations
2. Filter and sort packages
3. Select a package to proceed
4. Or choose alternative options if not satisfied

---

### **Step 3: Complete Booking**

**Purpose:** Finalize booking with selected package

**What User Sees:**
- Selected package details
- Event details summary
- Special requests textarea (optional)
- Booking confirmation button

**What Happens:**
1. User reviews selected package and event details
2. Optionally adds special requests
3. Clicks "Confirm Booking"
4. If not authenticated, redirected to login
5. If authenticated, booking is created
6. **Redirects to Booking Confirmation Page** with booking ID

**Backend Actions:**
- Creates booking record
- Sends confirmation email
- Broadcasts new booking event to admins

---

## 🔄 Alternative Flow Scenarios

### **Scenario 1: No Packages Found**

**When:** System returns empty recommendations or no packages match event type

**User Experience:**
```
Step 1: Fill Event Form
  ↓
Step 2: "No packages found" message displayed
  ↓
User Options:
  ├─> Request Custom Package
  ├─> Browse All Packages
  └─> Modify Search Criteria
```

**What Happens:**
1. System shows "No packages found" message
2. **Contact inquiry already created** (from Step 1 submission)
3. User sees three clear options:
   - **Request Custom Package** - Opens Contact Us form with all event details pre-filled
   - **Browse All Packages** - Navigate to full package catalog
   - **Modify Search** - Return to Step 1 to adjust criteria

**Contact Us Pre-filled Data:**
- Personal Information (name, email, phone)
- Event Type
- Event Date
- Event Time
- Venue
- Budget
- Number of Guests
- Motifs
- Pre-written message explaining they need a custom package

---

### **Scenario 2: Packages Found But Client Doesn't Like Them**

**When:** Recommendations exist but none match client's preferences

**User Experience:**
```
Step 1: Fill Event Form
  ↓
Step 2: Recommendations displayed
  ↓
User browses but doesn't select any package
  ↓
"Not finding what you're looking for?" help section visible
  ↓
User Options:
  ├─> Request Custom Package
  ├─> Browse All Packages
  └─> Modify Search Criteria
```

**What Happens:**
1. Recommendations are displayed with filters
2. User can browse, filter, and sort packages
3. Help section appears at bottom: "Not finding what you're looking for?"
4. User can choose from three options:
   - **Request Custom Package** - Contact Us form pre-filled with message explaining they didn't find suitable packages
   - **Browse All Packages** - View full catalog
   - **Modify Search** - Adjust search criteria

**Contact Us Pre-filled Data:**
- All event details from Step 1
- Pre-written message: "I'm interested in a custom package for my [event_type] event. The recommended packages don't quite match what I'm looking for. Event details: [all details]"

---

### **Scenario 3: User Not Authenticated**

**When:** User tries to complete booking without being logged in

**Flow:**
```
Step 3: User clicks "Confirm Booking"
  ↓
System detects user not authenticated
  ↓
Redirects to Login page
  ↓
After login, returns to Set An Event (state preserved)
```

**What Happens:**
1. User fills out all steps
2. On Step 3, clicks "Confirm Booking"
3. System checks authentication
4. If not authenticated:
   - Shows toast: "Please login to complete your booking"
   - Redirects to login page
   - Saves current state in sessionStorage
5. After login, user can return and complete booking

---

## 📊 Flow Decision Tree

```
START: Set An Event Page
│
├─> Step 1: Fill Form
│   │
│   ├─> Validation Fails → Show Errors → Stay on Step 1
│   │
│   └─> Validation Passes → Submit to /recommend
│       │
│       ├─> Success → Create Contact Inquiry → Move to Step 2
│       │
│       └─> Error → Show Error Message → Stay on Step 1
│
├─> Step 2: View Recommendations
│   │
│   ├─> No Packages Found
│   │   ├─> Show "No packages found" message
│   │   └─> Options:
│   │       ├─> Request Custom Package → Contact Us (pre-filled)
│   │       ├─> Browse All Packages → /packages
│   │       └─> Modify Search → Back to Step 1
│   │
│   ├─> Packages Found
│   │   ├─> User Selects Package → Move to Step 3
│   │   │
│   │   └─> User Doesn't Select → Show Help Section
│   │       └─> Options:
│   │           ├─> Request Custom Package → Contact Us (pre-filled)
│   │           ├─> Browse All Packages → /packages
│   │           └─> Modify Search → Back to Step 1
│   │
│   └─> User Goes Back → Return to Step 1
│
└─> Step 3: Complete Booking
    │
    ├─> Not Authenticated
    │   └─> Redirect to Login → Return after login
    │
    └─> Authenticated
        ├─> Submit Booking
        │   ├─> Success → Clear Saved Data → Redirect to Booking Confirmation
        │   └─> Error → Show Error → Stay on Step 3
        │
        └─> User Goes Back → Return to Step 2
```

---

## 🔑 Key Features

### **1. Automatic Contact Inquiry Creation**

- **When:** Step 1 form submission
- **What:** Contact inquiry automatically created in backend
- **Purpose:** Ensures admin can follow up even if no booking is made
- **Data Saved:**
  - Personal information
  - Event details
  - Preferences and requirements

### **2. State Persistence**

- **Method:** sessionStorage
- **What's Saved:**
  - Current step
  - Form data
  - Form errors
  - Recommendations
  - Selected package
  - Special requests
  - Filters and sort preferences

- **Purpose:** User can leave and return without losing progress

### **3. Pre-filled Contact Forms**

- **When:** User chooses "Request Custom Package"
- **What:** All event details automatically populated
- **Includes:**
  - Personal information
  - Event type, date, time, venue
  - Budget and guest count
  - Motifs/theme preferences
  - Pre-written message explaining situation

### **4. Multiple Exit Points**

Users always have options:
- Request custom package
- Browse all packages
- Modify search criteria
- Go back to previous step

---

## 🎨 User Experience Enhancements

### **Visual Indicators**

1. **Step Indicator** - Shows current step in the process
2. **Match Score Badges** - Visual percentage on each package
3. **Filter Controls** - Easy filtering and sorting
4. **Help Sections** - Clear guidance when stuck

### **Feedback Messages**

- Success: "We found some perfect matches for you!"
- Warning: "No packages found for your event type. Showing all available packages."
- Error: Clear validation and API error messages
- Info: "Your event details have been saved. Our team will contact you..."

---

## 🔄 Backend Integration

### **API Endpoints Used**

1. **POST `/api/recommend`**
   - Creates contact inquiry
   - Returns package recommendations
   - Scores packages based on criteria

2. **POST `/api/bookings`**
   - Creates booking record
   - Requires authentication
   - Returns booking data with ID

### **Data Flow**

```
Frontend (SetAnEvent)
  ↓
POST /api/recommend
  ↓
Backend (RecommendationController)
  ├─> Creates Contact Inquiry
  ├─> Scores Packages
  └─> Returns Recommendations
  ↓
Frontend (Step 2)
  ↓
User Selects Package
  ↓
POST /api/bookings
  ↓
Backend (BookingController)
  ├─> Creates Booking
  ├─> Sends Email
  └─> Broadcasts Event
  ↓
Frontend (Booking Confirmation)
```

---

## 📝 Important Notes

### **Contact Inquiry Creation**

- Contact inquiry is created **automatically** when Step 1 is submitted
- This happens regardless of whether user proceeds to booking
- Ensures no lead is lost
- Admin can follow up via contact inquiry management

### **State Management**

- All form state saved in sessionStorage
- Persists across page refreshes
- Cleared after successful booking
- Can be manually cleared if needed

### **Error Handling**

- Form validation errors shown inline
- API errors displayed via toast notifications
- User can retry or modify inputs
- No data loss on errors

---

## 🚀 Future Enhancements

### **Potential Improvements**

1. **Save for Later**
   - Allow users to save recommendations
   - Return to saved recommendations later

2. **Email Notifications**
   - Send recommendations via email
   - Reminder emails for incomplete flows

3. **Comparison Feature**
   - Compare multiple packages side-by-side
   - Detailed comparison view

4. **Chat Support**
   - Live chat option when no packages found
   - Instant help from support team

5. **Package Customization**
   - Request modifications to existing packages
   - Customize package before booking

---

## 📞 Support Flow

### **When User Needs Help**

1. **No Packages Found**
   - Clear message explaining situation
   - Direct link to request custom package
   - Pre-filled contact form

2. **Doesn't Like Recommendations**
   - Help section with options
   - Multiple paths forward
   - No dead ends

3. **Technical Issues**
   - Error messages with clear explanations
   - Option to retry
   - Contact support link

---

## ✅ Success Criteria

The event flow is successful when:

1. ✅ User can complete booking if suitable packages found
2. ✅ User has clear options when no packages found
3. ✅ Contact inquiry created for all submissions
4. ✅ User can request custom packages easily
5. ✅ State persists across navigation
6. ✅ Clear feedback at each step
7. ✅ No dead ends in the flow
8. ✅ Multiple exit points available

---

## 📚 Related Documentation

- [Client User Flow](./CLIENT_USER_FLOW.md)
- [Contact Inquiry Flow](./CONTACT_INQUIRY_FLOW.md)
- [Payment Flow](./PAYMENT_CLIENT_FLOW.md)
- [Booking Flow](./PAYMENT_FLOW_WITH_DEPOSIT_IMPLEMENTATION.md)

---

**Last Updated:** January 2025  
**Version:** 1.0
