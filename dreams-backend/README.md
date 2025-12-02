# Dreams Backend

Laravel API backend for the Dreams Event Management System.

## Installation

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

## API Endpoints

### Authentication

- POST `/api/register` - Register a new user
- POST `/api/login` - Login user
- POST `/api/logout` - Logout user (requires auth)
- GET `/api/user` - Get current user (requires auth)

### Packages

- GET `/api/packages` - Get all packages
- GET `/api/packages/{id}` - Get package details
- POST `/api/packages` - Create package (admin only)
- PUT `/api/packages/{id}` - Update package (admin only)
- DELETE `/api/packages/{id}` - Delete package (admin only)

### Bookings

- GET `/api/bookings` - Get user bookings (or all for admin)
- POST `/api/bookings` - Create booking
- GET `/api/bookings/{id}` - Get booking details
- PUT `/api/admin/bookings/{id}` - Update booking (admin only)

### Recommendations

- GET `/api/recommendations` - Get personalized recommendations (requires auth)
