# Pay Now Button Fix

## Problem
The "Pay Now" button was not appearing on unpaid bookings in the client dashboard, even though bookings showed "Unpaid" status.

## Root Cause
The `getPaymentInfo` function was using a limited path to find the package price:
```javascript
const totalAmount = parseFloat(booking?.total_amount || booking?.package?.package_price || 0);
```

This didn't check all possible paths where the package price might be stored (e.g., `eventPackage`, `event_package`, etc.), causing `totalAmount` to be 0, which made `remainingBalance` 0, and the button condition failed.

## Solution
Updated `getPaymentInfo` to check all possible package price paths (same as `getPackagePrice` function):
- `booking.eventPackage.package_price`
- `booking.event_package.package_price`
- `booking.eventPackage.price`
- `booking.event_package.price`
- `booking.package.package_price`
- `booking.package.price`
- `booking.package_price`
- `booking.price`
- `booking.total_amount` (checked first)

Also improved `canShowPayButton` to be more lenient - it will show the button if:
- Payment is required (or not explicitly set to false)
- Payment status is not 'paid'
- There's a remaining balance OR (total amount > 0 AND payment status is unpaid)
- Booking is not cancelled

## Files Changed
- `dreams-frontend/src/pages/Dashboard/client/ClientDashboard.jsx`
  - Updated `getPaymentInfo()` function (lines 145-157)
  - Updated `canShowPayButton()` function (lines 210-223)

## Testing
After the fix, the "Pay Now" button should appear for:
- ✅ Bookings with "Unpaid" status
- ✅ Bookings with "Partial" payment status
- ✅ Bookings that are not cancelled
- ✅ Bookings with a total amount > 0

The button will NOT appear for:
- ❌ Fully paid bookings
- ❌ Cancelled bookings
- ❌ Bookings with no payment required
- ❌ Bookings with total amount = 0

## Verification Steps
1. Log in as a client
2. Go to `/dashboard`
3. Check bookings with "Unpaid" status
4. Verify "Pay Now" button appears in:
   - Booking cards (List view)
   - Table actions column (Table view)

## Notes
- The backend API already loads the `eventPackage` relationship (line 78 in BookingController.php)
- Laravel may serialize relationships as `eventPackage` (camelCase) or `event_package` (snake_case)
- The fix handles both serialization formats
