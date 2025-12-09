# Coordinator User Guide

This guide explains how coordinators work in the Dreams Event Management System.

## Overview

Coordinators are users with **admin privileges** but with a distinct role. They can:

- Access all admin routes and features
- Manage bookings, packages, venues, portfolios, testimonials
- View and manage clients
- Handle contact inquiries

## Database Structure

Coordinators are stored in the `users` table with `role = 'coordinator'`. The role enum supports:

- `'admin'` - Full admin access
- `'coordinator'` - Admin privileges with coordinator role
- `'client'` - Regular client access

## How to Check if User is Coordinator

### Backend (Laravel/PHP)

#### In Controllers/Middleware:

```php
use App\Models\User;

// Method 1: Using the isCoordinator() method
if ($request->user()->isCoordinator()) {
    // User is a coordinator
}

// Method 2: Direct role check
if ($request->user()->role === 'coordinator') {
    // User is a coordinator
}

// Method 3: Check if user has admin privileges (includes coordinators)
if ($request->user()->isAdmin()) {
    // User is admin OR coordinator
    // Coordinators have admin privileges
}
```

#### In Blade Templates:

```php
@if(auth()->user()->isCoordinator())
    <!-- Coordinator-only content -->
@endif
```

### Frontend (React)

#### Using AuthContext:

```jsx
import { useAuth } from "../context/AuthContext";

function MyComponent() {
  const { user, isCoordinator, isAdmin } = useAuth();

  // Check if coordinator
  if (isCoordinator) {
    // Show coordinator features
  }

  // Check if admin (includes coordinators)
  if (isAdmin) {
    // Show admin features (works for both admin and coordinator)
  }

  // Direct check
  if (user?.role === "coordinator") {
    // Coordinator-specific logic
  }
}
```

#### Available AuthContext Properties:

- `isCoordinator` - Returns `true` if user role is 'coordinator'
- `isAdmin` - Returns `true` if user role is 'admin' OR 'coordinator'
- `user` - Contains the user object with role property

## How to Create a Coordinator User

### Method 1: Using Database Seeder (Recommended for Development)

The `UserSeeder` already includes a coordinator example:

```php
// database/seeders/UserSeeder.php
User::updateOrCreate(
    ['email' => 'coordinator@dreamsevents.com'],
    [
        'name' => 'Event Coordinator',
        'password' => Hash::make('coordinator123'),
        'phone' => '+63 912 345 6799',
        'role' => 'coordinator',
    ]
);
```

Run the seeder:

```bash
php artisan db:seed --class=UserSeeder
```

### Method 2: Using API Endpoint (Admin Only)

**Endpoint:** `POST /api/auth/create-coordinator`

**Headers:**

```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "John Coordinator",
  "email": "john.coordinator@dreamsevents.com",
  "password": "securePassword123",
  "password_confirmation": "securePassword123",
  "phone": "+63 912 345 6789"
}
```

**Response:**

```json
{
  "message": "Coordinator created successfully",
  "data": {
    "id": 5,
    "name": "John Coordinator",
    "email": "john.coordinator@dreamsevents.com",
    "role": "coordinator",
    "phone": "+63 912 345 6789",
    "created_at": "2025-12-09T08:00:00.000000Z",
    "updated_at": "2025-12-09T08:00:00.000000Z"
  }
}
```

### Method 3: Using Tinker (Laravel Console)

```bash
php artisan tinker
```

Then:

```php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

User::create([
    'name' => 'Coordinator Name',
    'email' => 'coordinator@example.com',
    'password' => Hash::make('password123'),
    'phone' => '+63 912 345 6789',
    'role' => 'coordinator',
]);
```

### Method 4: Direct Database Insert

```sql
INSERT INTO users (name, email, password, phone, role, created_at, updated_at)
VALUES (
    'Coordinator Name',
    'coordinator@example.com',
    '$2y$10$...', -- Use Hash::make() in PHP to generate this
    '+63 912 345 6789',
    'coordinator',
    NOW(),
    NOW()
);
```

### Method 5: Admin Panel (Future Implementation)

If you implement an admin panel for user management, you can add a form to create coordinators directly from the UI.

## Coordinator Privileges

### What Coordinators CAN Do:

✅ All admin operations (managed by `AdminMiddleware`)

- Manage packages (create, update, delete)
- Manage bookings (view all, update status)
- Manage clients (view all client data)
- Manage venues
- Manage portfolio items
- Manage testimonials
- Handle contact inquiries
- Create other coordinators (if using admin account)

### What Coordinators CANNOT Do:

❌ Cannot change their own role to 'admin' (requires admin)
❌ Cannot delete admin users (requires admin)
❌ Cannot access routes restricted to `role === 'admin'` only (if you add any)

## Middleware Protection

The `AdminMiddleware` checks for admin OR coordinator:

```php
// app/Http/Middleware/AdminMiddleware.php
if (!$request->user() || !$request->user()->isAdmin()) {
    return response()->json(['message' => 'Unauthorized'], 403);
}
```

Since `isAdmin()` returns `true` for both 'admin' and 'coordinator' roles, coordinators can access all admin routes.

## Example Usage in Frontend

```jsx
// Component that shows different UI for coordinators
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

function Dashboard() {
  const { user, isCoordinator, isAdmin } = useAuth();

  return (
    <div>
      {isCoordinator && (
        <div className="coordinator-badge">
          You are logged in as Coordinator
        </div>
      )}

      {isAdmin && (
        <nav>
          <Link to="/admin/packages">Manage Packages</Link>
          <Link to="/admin/bookings">Manage Bookings</Link>
          <Link to="/admin/clients">Manage Clients</Link>
        </nav>
      )}

      {isCoordinator && (
        <div className="coordinator-actions">
          <button>View Assigned Events</button>
          <button>Contact Clients</button>
        </div>
      )}
    </div>
  );
}
```

## Testing Coordinator Access

1. **Create a coordinator:**

   ```bash
   php artisan db:seed --class=UserSeeder
   ```

2. **Login as coordinator:**

   ```bash
   # Using the seeder credentials:
   Email: coordinator@dreamsevents.com
   Password: coordinator123
   ```

3. **Test admin routes:**
   All admin routes should be accessible with the coordinator token.

## Default Coordinator Credentials (From Seeder)

- **Email:** `coordinator@dreamsevents.com`
- **Password:** `coordinator123`
- **Role:** `coordinator`

**⚠️ Important:** Change the default password in production!
