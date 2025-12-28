# System Feature Analysis Based on Conceptual Framework

## Analysis Date: December 2024

This document analyzes the event management and recommendation system against the Input-Process-Output conceptual framework.

---

## INPUT FEATURES

| Feature                               | Exists     | Explanation                                                                                                                                                                                                                                                                                                                                 | Needed Improvements                                                                                                                                                                                                                                                                                                         |
| ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Coordinator: Personal Information** | ✅ Yes     | Coordinators are stored in `users` table with `role='coordinator'`. Personal info includes name, email, phone. Model: `User` with `isCoordinator()` method.                                                                                                                                                                                 | Add dedicated coordinator profile management endpoint. Currently coordinators use same user endpoints as clients/admins.                                                                                                                                                                                                    |
| **Coordinator: Event Packages**       | ✅ Yes     | Coordinators (as admins) can create, update, and delete event packages via `PackageController`. Full CRUD operations available at `/api/packages`.                                                                                                                                                                                          | No improvements needed. Fully functional.                                                                                                                                                                                                                                                                                   |
| **Coordinator: Past Event Details**   | ⚠️ Partial | Past events can be inferred from `booking_details` table with status 'Completed', but no dedicated endpoint or view for coordinators to see past events specifically. Bookings are accessible via `/api/bookings` but not filtered by completion status.                                                                                    | Create dedicated endpoint `/api/bookings/past` or `/api/events/past` for coordinators. Add filtering by completion status and date range. Create coordinator dashboard view for past events.                                                                                                                                |
| **Client: Personal Information**      | ✅ Yes     | Client information stored in both `users` table (for authentication) and `clients` table (for detailed info). Includes name, email, contact, address. Model: `Client` with relationships to bookings and recommendations.                                                                                                                   | Consider consolidating or better syncing between `users` and `clients` tables. Currently requires manual mapping via `ClientService`.                                                                                                                                                                                       |
| **Client: Event Preferences**         | ❌ No      | `event_preferences` table exists in migration but was dropped in later migration (`2025_12_09_081604_drop_unused_tables.php`). Preferences are collected in SetAnEvent form but not persistently stored. Only used temporarily for recommendations.                                                                                         | Re-implement `event_preferences` table. Create `EventPreference` model and controller. Add API endpoints to store/retrieve client preferences. Link preferences to authenticated users.                                                                                                                                     |
| **Client: Booking Details**           | ✅ Yes     | Fully implemented via `BookingController`. Clients can create bookings at `/api/bookings` (POST), view their bookings at `/api/bookings` (GET), and update bookings at `/api/bookings/{id}` (PATCH). Model: `BookingDetail` with relationships to client and package.                                                                       | Add booking cancellation endpoint for clients. Add booking history pagination.                                                                                                                                                                                                                                              |
| **Client: Reviews**                   | ⚠️ Partial | `reviews` table exists in database (migration `2025_12_02_080500_create_reviews_tbl_table.php`) with fields: `review_id`, `client_id`, `package_id`, `rating`, `review_message`. However, **NO controller or API endpoints exist** for creating/retrieving reviews. Frontend `Reviews.jsx` page displays testimonials instead, not reviews. | Create `ReviewController` with endpoints: `POST /api/reviews` (create), `GET /api/reviews` (list), `GET /api/reviews/{id}` (show), `GET /api/packages/{id}/reviews` (package reviews). Create `Review` model. Add review submission form in frontend. Link reviews to bookings (only allow reviews for completed bookings). |

---

## PROCESS FEATURES

| Feature                                      | Exists     | Explanation                                                                                                                                                                                                                                                                                                                          | Needed Improvements                                                                                                                                                                                                                                                                              |
| -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Generate Summary of Client Preferences**   | ⚠️ Partial | Preferences are collected in SetAnEvent form and used for recommendations, but not stored persistently or summarized. `RecommendationService` processes preferences temporarily during recommendation request. No summary generation or storage.                                                                                     | Implement preference storage system (see Event Preferences input above). Create `PreferenceSummaryService` to generate summaries from stored preferences and booking history. Add endpoint `/api/clients/{id}/preferences/summary` to retrieve preference summaries.                             |
| **Determine Coordinator Privileges**         | ✅ Yes     | Fully implemented via `User` model with `isAdmin()` and `isCoordinator()` methods. `AdminMiddleware` checks for admin/coordinator roles. Coordinators have admin privileges (can access all admin routes). Role-based access control working.                                                                                        | Consider implementing granular permissions system if coordinators need different privileges than full admins. Currently coordinators have same privileges as admins.                                                                                                                             |
| **Manage Event Bookings**                    | ✅ Yes     | Fully implemented via `BookingController` with comprehensive booking management: create, list, update, status management. Admin/coordinator can update booking status via `/api/bookings/status/{id}`. Status workflow: Pending → Approved → Completed/Cancelled. Email notifications sent on booking creation and status updates.   | Add booking search/filter functionality. Add booking calendar view. Add export functionality for bookings. Add booking analytics/reporting.                                                                                                                                                      |
| **Predict and Recommend Events for Clients** | ✅ Yes     | Fully implemented via `RecommendationController` and `RecommendationService`. Rule-based scoring system: +40 for type match, +30/+10 for budget match, +15 for theme match, +5 per preference match. Returns top 5 packages sorted by score. Recommendations logged to `recommendation_logs` table. Endpoint: `POST /api/recommend`. | Enhance recommendation algorithm with machine learning. Add collaborative filtering based on similar clients. Include past booking history in recommendations. Add recommendation explanation/justification display in frontend. Store recommendations persistently (currently only logs exist). |

---

## OUTPUT FEATURES

| Feature                          | Exists     | Explanation                                                                                                                                                                                                                                                                                                                       | Needed Improvements                                                                                                                                                                                                                      |
| -------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Coordinator Information**      | ⚠️ Partial | Coordinator info accessible via `/api/auth/me` endpoint (returns user info including role). `ClientController` can retrieve coordinator info if they're treated as clients. No dedicated coordinator information endpoint or profile view.                                                                                        | Create dedicated `/api/coordinators` endpoint. Create coordinator profile management. Add coordinator dashboard with their specific metrics (events managed, success rate, etc.).                                                        |
| **Event Booking Transactions**   | ✅ Yes     | Fully implemented. Booking transactions accessible via `/api/bookings` endpoint. Admin/coordinator can see all bookings; clients see only their own. Booking details include: client, package, event date, venue, guest count, status, special requests. Status updates tracked.                                                  | Add transaction history export. Add booking receipt generation. Add payment tracking if applicable. Add booking analytics dashboard.                                                                                                     |
| **List of Events**               | ✅ Yes     | Fully implemented via `PackageController`. Public endpoint `/api/packages` lists all event packages. Package details available at `/api/packages/{id}`. Includes package name, description, price, category, venue, images. Frontend displays packages in Packages page and PackageDetails page.                                  | Add filtering and search functionality (by type, price range, venue). Add pagination for large lists. Add sorting options. Add featured packages highlighting.                                                                           |
| **User Reviews and Feedback**    | ⚠️ Partial | **Testimonials** are fully implemented (`TestimonialController`, `/api/testimonials` endpoint). Clients can submit testimonials via `/api/testimonials/submit`. Frontend displays testimonials in Reviews page. However, **Reviews** (package-specific reviews with ratings) are NOT implemented despite database table existing. | Implement Review system (see Client: Reviews input above). Add review display on package details page. Add review moderation for coordinators/admins. Add review analytics (average ratings per package, review trends).                 |
| **Generated Recommended Events** | ✅ Yes     | Fully implemented. Recommendations returned from `/api/recommend` endpoint include: package details, score, and justification. Frontend displays recommendations in SetAnEvent page and Recommendations page. Recommendations are logged to `recommendation_logs` table. Top 5 packages returned sorted by score.                 | Add recommendation history view for clients. Add "save for later" functionality. Add recommendation comparison feature. Add feedback mechanism (did client book recommended package?). Improve recommendation display with better UI/UX. |

---

## SUMMARY STATISTICS

- **Fully Implemented:** 7 features (50%)
- **Partially Implemented:** 5 features (36%)
- **Not Implemented:** 2 features (14%)

### Priority Improvements Needed:

1. **HIGH PRIORITY:**

   - Implement Review system (database exists, no controller/API)
   - Implement Client Event Preferences storage and summary
   - Create Past Events endpoint for coordinators

2. **MEDIUM PRIORITY:**

   - Add coordinator-specific endpoints and dashboard
   - Enhance recommendation algorithm
   - Add booking search/filter functionality

3. **LOW PRIORITY:**
   - Add granular permissions for coordinators
   - Add booking analytics
   - Add recommendation history and feedback

---

## NOTES

- The system uses two user models: `User` (for authentication) and `Client` (for detailed client info). This dual-model approach requires careful mapping via `ClientService`.
- The `reviews` table exists but is completely unused. The frontend Reviews page displays testimonials instead.
- The `event_preferences` table was created but later dropped, indicating it was planned but not implemented.
- Coordinators currently have the same privileges as admins (full admin access). Consider if this matches business requirements.
- The recommendation system is functional but could be enhanced with ML and collaborative filtering.

---

**Generated:** December 2024  
**System Status:** ✅ Core Features Operational | ⚠️ Some Features Incomplete | ❌ Missing Critical Features
