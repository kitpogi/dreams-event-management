# API Reference

Base URL: `http://localhost:8000/api`

## Authentication Endpoints

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "phone": "1234567890"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "1|...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client"
  }
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

## Package Endpoints

### List Packages
```http
GET /api/packages
Authorization: Bearer {token}

Query Parameters:
- featured: boolean
- search: string
- minPrice: number
- maxPrice: number
```

### Get Package Details
```http
GET /api/packages/{id}
Authorization: Bearer {token}
```

### Create Package (Admin Only)
```http
POST /api/packages
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Wedding Package",
  "description": "Elegant wedding package",
  "price": 5000,
  "capacity": 100,
  "venue_id": 1,
  "type": "wedding",
  "theme": "elegant",
  "is_featured": true
}
```

### Update Package (Admin Only)
```http
PUT /api/packages/{id}
PATCH /api/packages/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Package Name",
  "price": 5500
}
```

### Delete Package (Admin Only)
```http
DELETE /api/packages/{id}
Authorization: Bearer {token}
```

## Booking Endpoints

### Create Booking
```http
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "package_id": 1,
  "event_date": "2024-12-25",
  "event_time": "18:00",
  "number_of_guests": 80,
  "special_requests": "Outdoor ceremony preferred"
}
```

### List Bookings
```http
GET /api/bookings
Authorization: Bearer {token}
```
- Returns user's own bookings (clients)
- Returns all bookings (admins)

### Update Booking
```http
PATCH /api/bookings/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "event_date": "2024-12-26",
  "number_of_guests": 90
}
```

### Update Booking Status (Admin Only)
```http
PATCH /api/bookings/status/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "confirmed"
}
```

Status values: `pending`, `confirmed`, `cancelled`

## Recommendation Endpoint

### Get Recommendations
```http
POST /api/recommend
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "wedding",
  "budget": 5000,
  "guests": 100,
  "theme": "elegant",
  "preferences": ["outdoor", "photography", "catering"]
}
```

Response:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Elegant Wedding Package",
      "description": "...",
      "price": 4800,
      "capacity": 120,
      "venue": {...},
      "images": [...],
      "score": 85,
      "justification": "Type match (+40), Within 20% of budget (+20), Capacity sufficient (+10), Theme match (+10), 2 preference match(es) (+10)"
    },
    ...
  ],
  "message": "Top 5 packages based on your criteria"
}
```

## Scoring System

The recommendation engine uses the following scoring:

- **+40 points**: Type match
- **+20 points**: Price within 20% of budget
- **+10 points**: Capacity >= guests
- **+10 points**: Theme match
- **+5 points**: Each preference keyword match

Returns top 5 packages sorted by score (descending).

