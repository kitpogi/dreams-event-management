# Contact Inquiry Flow Documentation

**Last Updated:** December 2024  
**Status:** ✅ Fully Implemented

---

## 📊 Contact Inquiry Flow Overview

The contact inquiry system allows users to submit inquiries about events, packages, and services. Inquiries can be created from multiple entry points and are managed by administrators through a dedicated dashboard.

---

## 🔄 Complete Contact Inquiry Flow

### **Entry Points for Contact Inquiries**

Contact inquiries can be created from three main sources:

1. **Contact Us Page** - Direct inquiry form
2. **Set An Event Page** - Inquiry created when getting recommendations
3. **Recommendations Page** - Inquiry created when user requests custom package

---

## 📝 Flow 1: Contact Us Page Inquiry

### **Step 1: User Access**
1. User navigates to `/contact-us` page
2. `ContactUs.jsx` component renders
3. `ContactFormModal` is displayed

**Files:**
- `ContactUs.jsx` - Contact page component
- `ContactFormModal.jsx` - Contact form modal

---

### **Step 2: Form Filling**
User fills out the contact form with:

**Required Fields:**
- First Name
- Last Name
- Email Address
- Mobile Number
- Event Type (wedding, debut, birthday, pageant, corporate, anniversary, other)
- Date of Event
- Preferred Reception/Celebration Venue
- Budget
- Estimated Number of Guests
- Additional Information / Message

**Optional Pre-filled Data:**
- Form can be pre-filled with data from `SetAnEvent` page via `location.state`
- Data from session storage (if coming from Set An Event flow)

**Files:**
- `ContactFormModal.jsx::useEffect()` - Handles initial data population

---

### **Step 3: Form Validation**
1. Frontend validates all required fields
2. Email format validation
3. Budget must be >= 0
4. Estimated guests must be >= 1
5. Date must be in the future

**Validation Rules:**
```javascript
- first_name: Required
- last_name: Required
- email: Required, valid email format
- mobile_number: Required
- event_type: Required, must be one of: wedding, debut, birthday, pageant, corporate, anniversary, other
- date_of_event: Required, must be future date
- preferred_venue: Required
- budget: Required, >= 0
- estimated_guests: Required, >= 1
- message: Required, max 2000 characters
```

**Files:**
- `ContactFormModal.jsx::validate()`

---

### **Step 4: Form Submission**
1. User clicks "Submit Inquiry" button
2. `handleSubmit()` is called
3. Frontend sends POST request to `/api/contact`

**API Request:**
```javascript
POST /api/contact
Body: {
  first_name: string,
  last_name: string,
  name: string (constructed from first_name + last_name),
  email: string,
  mobile_number: string,
  event_type: string,
  date_of_event: string (YYYY-MM-DD),
  preferred_venue: string,
  budget: number,
  estimated_guests: number,
  message: string
}
```

**Files:**
- `ContactFormModal.jsx::handleSubmit()`
- `contactService.js` - API service (if used)

---

### **Step 5: Backend Processing**
1. `ContactController::store()` receives request
2. Backend validates all fields
3. Contact inquiry record is created in database
4. Status is set to `'new'`
5. Response is sent back to frontend

**Backend Validation:**
```php
- name: nullable|string|max:255 (for backward compatibility)
- first_name: required_without:name|string|max:255
- last_name: required_without:name|string|max:255
- email: required|email|max:255
- mobile_number: required|string|max:20
- event_type: required|in:wedding,debut,birthday,pageant,corporate,anniversary,other
- date_of_event: nullable|date
- preferred_venue: required|string|max:255
- budget: nullable|numeric|min:0
- estimated_guests: nullable|integer|min:1
- message: required|string|max:2000
```

**Database Record Created:**
```php
ContactInquiry::create([
  'name' => trim($name),
  'first_name' => $request->first_name,
  'last_name' => $request->last_name,
  'email' => $request->email,
  'mobile_number' => $request->mobile_number,
  'event_type' => $request->event_type,
  'date_of_event' => $request->date_of_event,
  'preferred_venue' => $request->preferred_venue,
  'budget' => $request->budget,
  'estimated_guests' => $request->estimated_guests,
  'message' => $request->message,
  'status' => 'new',
]);
```

**Files:**
- `ContactController.php::store()`
- `ContactInquiry.php` - Model

---

### **Step 6: Email Notifications**

After inquiry is saved, emails are sent (best-effort, non-blocking):

1. **Confirmation Email to Client:**
   - Sent to inquiry email address
   - Uses `ContactInquiryConfirmationMail` mailable
   - Subject: "We received your inquiry - Dreams Events"
   - Template: `emails.contact-inquiry-confirmation.blade.php`

2. **Admin Notification Email:**
   - Sent to admin email (from `CONTACT_NOTIFY_EMAIL` or `MAIL_FROM_ADDRESS`)
   - Same email template as client confirmation
   - Notifies admin of new inquiry

**Email Errors:**
- Email failures are logged but don't block the response
- User still receives success message even if email fails

**Files:**
- `ContactController.php::store()` - Email sending logic
- `ContactInquiryConfirmationMail.php` - Mailable class
- `resources/views/emails/contact-inquiry-confirmation.blade.php` - Email template

---

### **Step 7: Success Response**
1. Frontend receives success response
2. Success message is displayed
3. Form is cleared
4. SetAnEvent form data is removed from sessionStorage (if exists)
5. Modal closes after 2 seconds
6. User is redirected back or to success page

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your message! We will get back to you soon.",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    ...
  }
}
```

**Files:**
- `ContactFormModal.jsx::handleSubmit()` - Success handling

---

## 📝 Flow 2: Set An Event Inquiry

### **Step 1: User Fills Set An Event Form**
1. User navigates to `/set-an-event`
2. Fills out event details form
3. Submits form to get recommendations

**Files:**
- `SetAnEvent.jsx` - Set An Event page

---

### **Step 2: Recommendations Request**
1. Form data is sent to `/api/recommend`
2. `RecommendationController::recommend()` processes request
3. Recommendations are generated
4. **Contact inquiry is automatically created** if user provided contact info

**Auto-Creation Logic:**
```php
if ($request->filled('first_name') && 
    $request->filled('last_name') && 
    $request->filled('email')) {
    
    // Build inquiry message from form data
    $inquiryMessage = "Event Inquiry from Set An Event form.\n\n";
    $inquiryMessage .= "Event Date: " . ($request->event_date ?? 'Not specified') . "\n";
    $inquiryMessage .= "Event Time: " . ($request->event_time ?? 'Not specified') . "\n";
    $inquiryMessage .= "Preferred Venue: " . ($request->venue ?? 'Not specified') . "\n";
    $inquiryMessage .= "Guest Count: " . ($guests ?? 'Not specified') . "\n";
    $inquiryMessage .= "Budget: " . ($budget ? '₱' . number_format($budget, 2) : 'Not specified') . "\n";
    $inquiryMessage .= "Motifs/Themes: " . ($theme ?? 'Not specified') . "\n\n";
    $inquiryMessage .= "User is interested in the recommended packages.";
    
    // Create contact inquiry
    ContactInquiry::create([...]);
}
```

**Files:**
- `RecommendationController.php::recommend()` - Auto-creates inquiry

---

### **Step 3: User Can Also Submit Explicit Inquiry**
1. User views recommendations
2. User clicks "Contact Us" button
3. `ContactFormModal` opens with pre-filled data from Set An Event
4. User can modify and submit inquiry (follows Flow 1 steps 3-7)

**Files:**
- `Recommendations.jsx` - Recommendations page with Contact Us link

---

## 📝 Flow 3: Recommendations Page Inquiry

### **Step 1: User Views Recommendations**
1. User is on recommendations page
2. Sees recommended packages
3. Wants to request custom package

---

### **Step 2: Contact Us from Recommendations**
1. User clicks "Contact Us" button
2. `ContactFormModal` opens
3. Form is pre-filled with inquiry data from recommendations
4. User submits inquiry (follows Flow 1 steps 3-7)

**Pre-filled Data:**
- Event details from recommendations
- User information (if available)
- Message includes: "I would like to request a custom package tailored to my needs."

**Files:**
- `Recommendations.jsx` - Contact Us link with state data
- `ContactFormModal.jsx` - Handles initial data

---

## 👨‍💼 Admin Management Flow

### **Step 1: View Inquiries**
1. Admin navigates to `/admin/contact-inquiries`
2. `ManageContactInquiries` component loads
3. Fetches all inquiries from `/api/contact-inquiries`
4. Displays inquiries in a list/table

**API Endpoint:**
```
GET /api/contact-inquiries
Response: {
  "success": true,
  "data": [inquiry objects]
}
```

**Files:**
- `ManageContactInquiries.jsx` - Admin management page
- `ContactController.php::index()` - List inquiries endpoint

---

### **Step 2: Filter Inquiries**
Admin can filter inquiries by:
- **Status:** All, New, Contacted, Converted, Closed
- **Event Type:** (future feature)

**Filter Implementation:**
```javascript
const filteredInquiries = filterStatus === 'all' 
  ? inquiries 
  : inquiries.filter(inq => inq.status === filterStatus);
```

**Files:**
- `ManageContactInquiries.jsx` - Filter logic

---

### **Step 3: Update Inquiry Status**
1. Admin selects new status from dropdown
2. Frontend calls `PATCH /api/contact-inquiries/{id}/status`
3. Backend updates inquiry status
4. UI updates to reflect new status

**Status Options:**
- `new` - New inquiry, not yet contacted
- `contacted` - Admin has reached out to client
- `converted` - Inquiry converted to a booking
- `closed` - Inquiry resolved or no longer active

**API Endpoint:**
```
PATCH /api/contact-inquiries/{id}/status
Body: {
  "status": "contacted" | "converted" | "closed"
}
```

**Files:**
- `ManageContactInquiries.jsx::handleStatusUpdate()`
- `ContactController.php::updateStatus()`

---

### **Step 4: Reply to Inquiry**
1. Admin clicks "Reply via Email" button
2. Opens default email client with pre-filled:
   - To: Inquiry email
   - Subject: "Re: Your Event Inquiry - {event_type}"
3. Admin can compose and send email

**Implementation:**
```javascript
<a href={`mailto:${inquiry.email}?subject=Re: Your Event Inquiry - ${inquiry.event_type || 'Event'}`}>
  Reply via Email
</a>
```

**Files:**
- `ManageContactInquiries.jsx` - Email link

---

### **Step 5: Export Inquiries (CSV)**
1. Admin clicks export button
2. Backend generates CSV file
3. File is downloaded with filename: `contact_inquiries_YYYY_MM_DD_HHMMSS.csv`

**CSV Columns:**
- Inquiry ID
- Name
- Email
- Mobile Number
- Event Type
- Event Date
- Preferred Venue
- Budget
- Estimated Guests
- Status
- Message
- Created At

**API Endpoint:**
```
GET /api/contact-inquiries/export?status={status}&event_type={type}
Response: CSV file download
```

**Files:**
- `ContactController.php::export()` - CSV export logic

---

## 📊 Inquiry Status Lifecycle

```
New Inquiry Created
  ↓
Status: "new"
  ↓
[Admin Reviews]
  ↓
Status Updated:
  ├─> "contacted" (Admin reached out)
  │     ↓
  │   [Client Responds]
  │     ↓
  ├─> "converted" (Became a booking)
  │     ↓
  └─> "closed" (Resolved/No longer active)
```

---

## 📋 Database Schema

### `contact_inquiries` Table:
```sql
- id (primary key)
- name (string, nullable - for backward compatibility)
- first_name (string)
- last_name (string)
- email (string)
- mobile_number (string)
- event_type (enum: wedding, debut, birthday, pageant, corporate, anniversary, other)
- date_of_event (date, nullable)
- preferred_venue (string)
- budget (decimal, nullable)
- estimated_guests (integer, nullable)
- message (text)
- status (enum: new, contacted, converted, closed)
- created_at (timestamp)
- updated_at (timestamp)
```

**Migration File:**
- `database/migrations/*_create_contact_inquiries_table.php`

---

## 🔔 Email Notifications

### **Client Confirmation Email**
- **Trigger:** When inquiry is created
- **Recipient:** Inquiry email address
- **Subject:** "We received your inquiry - Dreams Events"
- **Content:** Confirmation message with inquiry details
- **Template:** `resources/views/emails/contact-inquiry-confirmation.blade.php`

### **Admin Notification Email**
- **Trigger:** When inquiry is created
- **Recipient:** Admin email (`CONTACT_NOTIFY_EMAIL` or `MAIL_FROM_ADDRESS`)
- **Subject:** "We received your inquiry - Dreams Events"
- **Content:** Same as client confirmation
- **Purpose:** Notify admin of new inquiry

**Email Configuration:**
```env
# Backend .env
CONTACT_NOTIFY_EMAIL=admin@example.com  # Optional, defaults to MAIL_FROM_ADDRESS
MAIL_FROM_ADDRESS=noreply@example.com
```

---

## 🔗 Integration Points

### **1. Set An Event Integration**
- Automatically creates inquiry when recommendations are requested
- Pre-fills contact form with event details

### **2. Recommendations Integration**
- Allows users to request custom packages
- Pre-fills contact form with recommendation data

### **3. Admin Dashboard Integration**
- Shows inquiry count in dashboard statistics
- Notification center shows new inquiries
- Links to inquiry management page

### **4. Analytics Integration**
- Inquiry counts in dashboard analytics
- Inquiry status breakdown
- Conversion tracking (inquiry → booking)

---

## 📝 Key Files Reference

### **Frontend:**
- `src/pages/public/ContactUs.jsx` - Contact page
- `src/components/modals/ContactFormModal.jsx` - Contact form modal
- `src/pages/Dashboard/admin/ManageContactInquiries.jsx` - Admin management
- `src/api/services/contactService.js` - Contact API service

### **Backend:**
- `app/Http/Controllers/Api/ContactController.php` - Contact API endpoints
- `app/Models/ContactInquiry.php` - Contact inquiry model
- `app/Mail/ContactInquiryConfirmationMail.php` - Email mailable
- `resources/views/emails/contact-inquiry-confirmation.blade.php` - Email template
- `database/migrations/*_create_contact_inquiries_table.php` - Database migration

### **Routes:**
- `routes/api.php` - API routes for contact inquiries

---

## 🚀 Future Enhancements

- [ ] Inquiry priority levels (high, medium, low)
- [ ] Internal notes/comments on inquiries
- [ ] Inquiry assignment to specific staff members
- [ ] SMS notifications for new inquiries
- [ ] Inquiry follow-up reminders
- [ ] Integration with CRM systems
- [ ] Inquiry templates for common responses
- [ ] Bulk status updates
- [ ] Advanced filtering and search
- [ ] Inquiry analytics dashboard

---

## 📞 Support

For issues with contact inquiries:
- Check logs: `storage/logs/laravel.log`
- Check browser console for frontend errors
- Verify email configuration in `.env`
- Check database for inquiry records

