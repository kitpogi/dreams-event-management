# Client User Flow - D'Dreams Events and Styles System

## Overview

This document outlines the complete user journey for clients using the D'Dreams Events and Styles event management system.

---

## 🎯 Main User Flows

### **Flow 1: Browse and Inquire About Packages**

```
1. Home Page
   └─> Client lands on homepage
       ├─> Views featured packages
       ├─> Views portfolio/gallery
       └─> Views testimonials

2. Browse Packages
   └─> Navigate to "Packages" page
       ├─> View all available packages
       ├─> Filter by category/type
       └─> Click on package card/image
           └─> View Package Details
               ├─> See package description
               ├─> View package inclusions
               ├─> See pricing
               └─> Click "Inquire Rates"
                   └─> Redirected to Contact Us page
```

### **Flow 2: Get Personalized Recommendations (Set An Event)**

```
1. Navigate to "Set An Event" Page
   └─> Click "Set An Event" in navigation

2. Fill Out Event Inquiry Form
   ├─> Personal Information:
   │   ├─> First Name
   │   ├─> Last Name
   │   ├─> Email
   │   └─> Phone Number
   │
   ├─> Event Details:
   │   ├─> Event Type (Wedding, Birthday, Debut, etc.)
   │   ├─> Event Date
   │   ├─> Event Time
   │   ├─> Preferred Venue
   │   ├─> Budget Range
   │   ├─> Estimated Number of Guests
   │   ├─> Motifs/Theme (multiple selection)
   │   └─> Additional Information/Message
   │
   └─> Submit Form
       └─> System automatically:
           ├─> Saves inquiry as Contact Inquiry
           ├─> Generates personalized package recommendations
           └─> Redirects to Recommendations Page
```

### **Flow 3: View Recommendations and Take Action**

```
1. Recommendations Page
   └─> Displays personalized packages based on preferences
       ├─> Shows success banner
       ├─> Displays top 5 recommended packages
       │   ├─> Package image
       │   ├─> Package name
       │   ├─> Price
       │   ├─> Match score badge (percentage)
       │   └─> Match justification
       │
       ├─> Filter Options:
       │   ├─> Filter by Event Type
       │   ├─> Filter by Budget Range
       │   ├─> Filter by Number of Guests
       │   └─> Sort by (Match Score, Price)
       │
       └─> For Each Package Card:
           └─> Three Action Buttons:
               ├─> "View Details" (Indigo)
               │   └─> Navigate to Package Details page
               │
               ├─> "Contact Us" (Amber/Gold)
               │   └─> Navigate to Contact Us page
               │       └─> Form pre-filled with inquiry data
               │
               └─> "Book Now" / "Login to Book" (Green)
                   ├─> If NOT logged in:
                   │   └─> Redirect to Login page
                   │       └─> After login, redirect to Booking page
                   │
                   └─> If logged in:
                       └─> Navigate directly to Booking Form
```

### **Flow 4: Direct Package Booking (Authenticated Users)**

```
1. Login/Register
   └─> Client creates account or logs in
       ├─> Registration requires:
       │   ├─> Name
       │   ├─> Email
       │   ├─> Password
       │   └─> Phone Number
       │
       └─> Login requires:
           ├─> Email
           └─> Password

2. Select Package
   └─> From Packages page or Package Details
       └─> Click "Book Now" button
           └─> Navigate to Booking Form

3. Fill Out Booking Form
   ├─> Package information (pre-filled)
   ├─> Event Details:
   │   ├─> Event Date
   │   ├─> Event Time
   │   ├─> Number of Guests
   │   └─> Special Requirements
   │
   └─> Submit Booking Request
       └─> Booking status: "Pending"
           └─> Admin will review and approve
```

### **Flow 5: Contact Us Directly**

```
1. Navigate to "Contact Us" Page
   └─> Click "Contact Us" in navigation or from package pages

2. Fill Out Contact Form
   ├─> Personal Information:
   │   ├─> First Name *
   │   ├─> Last Name *
   │   ├─> Email Address *
   │   └─> Mobile Number *
   │
   ├─> Event Details:
   │   ├─> Event Type *
   │   ├─> Date of Event *
   │   ├─> Preferred Reception/Celebration Venue *
   │   ├─> Budget *
   │   └─> Estimated Number of Guests *
   │
   └─> Additional Information:
       └─> Message *
           └─> Submit Inquiry
               └─> Inquiry saved with status: "New"
                   └─> Admin will be notified
```

### **Flow 6: Get Recommendations via Form (Alternative)**

```
1. Navigate to Recommendations Page
   └─> If no recommendations yet, form is displayed

2. Fill Out Recommendation Form
   ├─> Event Type (dropdown)
   ├─> Budget ($)
   ├─> Number of Guests
   ├─> Theme (e.g., elegant, modern, rustic)
   └─> Preferences (comma-separated keywords)
       └─> Click "Get Recommendations"
           └─> System generates recommendations
               └─> Displays matching packages
```

---

## 📱 Client Dashboard (After Login)

### **Flow 7: Manage Bookings and Account**

```
1. Access Client Dashboard
   └─> Navigate to "Dashboard" (after login)

2. View Dashboard Overview
   ├─> See booking statistics
   ├─> View recent bookings
   │   ├─> Booking status badges:
   │   │   ├─> Pending (Yellow)
   │   │   ├─> Approved (Green)
   │   │   ├─> Completed (Blue)
   │   │   └─> Cancelled (Red)
   │   │
   │   └─> Booking details:
   │       ├─> Package name
   │       ├─> Event date
   │       ├─> Number of guests
   │       └─> Status
   │
   └─> Actions Available:
       ├─> View booking details
       └─> Submit testimonial (if booking is Completed/Approved)
```

### **Flow 8: Submit Testimonial**

```
1. Access Testimonial Submission
   └─> From Client Dashboard
       └─> Click "Share Your Experience" button
           └─> (Only shown if client has Completed/Approved bookings)

2. Fill Out Testimonial Form
   ├─> Select Event/Booking (dropdown of completed bookings)
   ├─> Rating (1-5 stars)
   ├─> Message/Review
   ├─> Optional: Upload Avatar
   └─> Submit Testimonial
       └─> Status: Pending moderation
           └─> Admin reviews and can feature it
```

---

## 🔄 Complete User Journey Examples

### **Example 1: New Client - Wedding Planning**

```
Step 1: Discovery
  → Visits homepage
  → Browses packages
  → Views portfolio

Step 2: Inquiry
  → Clicks "Set An Event"
  → Fills out event form (Wedding, 200 guests, $10,000 budget)
  → Submits form

Step 3: Recommendations
  → Views personalized recommendations
  → Sees 5 matching packages with match scores
  → Filters by budget range
  → Clicks "View Details" on preferred package

Step 4: Contact
  → Reviews package details
  → Clicks "Contact Us"
  → Form pre-filled with inquiry data
  → Adds additional questions
  → Submits inquiry

Step 5: Booking (After Admin Response)
  → Creates account
  → Logs in
  → Selects package
  → Fills booking form
  → Submits booking request

Step 6: Management
  → Views booking in dashboard
  → Tracks status (Pending → Approved)
  → Receives confirmation

Step 7: After Event
  → Booking status: Completed
  → Submits testimonial
  → Shares experience
```

### **Example 2: Returning Client - Quick Booking**

```
Step 1: Login
  → Logs into existing account

Step 2: Browse
  → Views packages
  → Finds desired package

Step 3: Book
  → Clicks "Book Now"
  → Fills booking form
  → Submits immediately

Step 4: Track
  → Monitors booking status in dashboard
  → Views booking details
```

---

## 🎨 Key Features for Clients

### **1. Package Discovery**

- Browse all packages
- Filter by category
- View detailed package information
- See package inclusions
- View package images

### **2. Personalized Recommendations**

- AI-powered matching based on preferences
- Match score indicators
- Filter and sort options
- Multiple action paths

### **3. Multiple Inquiry Methods**

- **Set An Event**: Comprehensive form with recommendations
- **Contact Us**: Direct inquiry form
- **Package Details**: Quick inquiry from package page
- **Recommendations Page**: Form-based recommendations

### **4. Booking Management**

- View all bookings
- Track booking status
- See booking details
- Submit testimonials after completion

### **5. User Account**

- Registration and login
- Dashboard overview
- Booking history
- Testimonial submission

---

## 📊 Status Flow for Bookings

```
Pending
  ↓
[Admin Reviews]
  ↓
Approved ──→ Completed
  ↓            ↓
Cancelled   [Client can submit testimonial]
```

---

## 🔐 Authentication Flow

```
Not Authenticated
  ↓
[Browse packages, view details, get recommendations]
  ↓
[Click "Book Now" or "Login to Book"]
  ↓
Login/Register Page
  ↓
Authenticated
  ↓
[Full access: Book packages, view dashboard, submit testimonials]
```

---

## 📝 Contact Inquiry Flow

```
Client Submits Inquiry
  ↓
[Via Contact Us page OR Set An Event page]
  ↓
Inquiry Saved
  ↓
Status: "New"
  ↓
[Admin Reviews]
  ↓
Status Updated:
  ├─> "Contacted" (Admin reached out)
  ├─> "Converted" (Became a booking)
  └─> "Closed" (Resolved/No longer active)
```

---

## 🎯 Quick Reference: Navigation Paths

### **For Non-Authenticated Users:**

- Home → Packages → Package Details → Contact Us
- Home → Set An Event → Recommendations → Package Details → Contact Us
- Home → Contact Us (Direct)
- Home → Recommendations → Fill Form → View Recommendations

### **For Authenticated Users:**

- All above paths PLUS:
- Home → Packages → Package Details → Book Now → Booking Form
- Dashboard → View Bookings → Submit Testimonial
- Dashboard → View Booking Details

---

## 💡 Tips for Clients

1. **Use "Set An Event"** for personalized recommendations
2. **Browse packages** to see all available options
3. **Contact Us** for direct inquiries or questions
4. **Create an account** to book packages directly
5. **Check dashboard** regularly for booking updates
6. **Submit testimonials** after your event to help others

---

## 🔄 System Integration Points

- **Contact Inquiries** → Saved automatically from Contact Us and Set An Event
- **Recommendations** → Generated from Set An Event form data
- **Bookings** → Created from authenticated booking form
- **Testimonials** → Submitted by clients with completed bookings
- **Admin Review** → All inquiries and bookings reviewed by admin

---

This flow ensures clients have multiple ways to discover, inquire about, and book event packages while maintaining a smooth user experience throughout their journey.
