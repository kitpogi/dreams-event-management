# Dreams Backend Setup Guide

## Prerequisites
- PHP >= 8.1
- Composer
- MySQL
- Laravel 11

## Installation Steps

### 1. Install Dependencies
```bash
composer install
```

### 2. Environment Configuration
```bash
cp .env.example .env
php artisan key:generate
```

### 3. Database Configuration
Update `.env` with your database settings:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dreamsdb
DB_USERNAME=root
DB_PASSWORD=
```

### 4. Run Migrations
```bash
php artisan migrate
```

### 5. Configure Sanctum for SPA
The Sanctum configuration is already set up in `config/sanctum.php` with:
- Stateful domains: `localhost:5173`, `localhost:3000`
- CSRF protection configured

### 6. Configure CORS
CORS is configured in `config/cors.php` to allow:
- Origin: `http://localhost:5173`
- Credentials: enabled

### 7. Start the Server
```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout (requires auth)
- `GET /api/auth/me` - Get current user (requires auth)

### Packages
- `GET /api/packages` - List all packages
- `GET /api/packages/{id}` - Get package details
- `POST /api/packages` - Create package (admin only)
- `PUT/PATCH /api/packages/{id}` - Update package (admin only)
- `DELETE /api/packages/{id}` - Delete package (admin only)

### Bookings
- `POST /api/bookings` - Create booking (requires auth)
- `GET /api/bookings` - List bookings (user's own or all for admin)
- `PATCH /api/bookings/{id}` - Update booking
- `PATCH /api/bookings/status/{id}` - Update booking status (admin only)

### Recommendations
- `POST /api/recommend` - Get package recommendations (requires auth)

## Recommendation Engine

The recommendation engine uses rule-based scoring:

**Input:**
```json
{
  "type": "wedding",
  "budget": 5000,
  "guests": 100,
  "theme": "elegant",
  "preferences": ["outdoor", "photography"]
}
```

**Scoring Rules:**
- +40 points: Type match
- +20 points: Price within 20% of budget
- +10 points: Capacity >= guests
- +10 points: Theme match
- +5 points: Each preference keyword match

**Output:**
Returns top 5 packages sorted by score with justification for each.

