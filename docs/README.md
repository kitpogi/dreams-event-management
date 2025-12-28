# Dreams Event Management System

A full-stack event management system built with Laravel (backend) and React Vite (frontend).

## Project Structure

```
dreamsSystem/
├── dreams-backend/     # Laravel API
└── dreams-frontend/    # React Vite Frontend
```

## Getting Started

### Backend Setup (Laravel)

1. Navigate to the backend directory:

```bash
cd dreams-backend
```

2. Install dependencies:

```bash
composer install
```

3. Set up environment:

```bash
cp .env.example .env
php artisan key:generate
```

4. Configure database in `.env` file

5. Run migrations:

```bash
php artisan migrate
```

6. Start the server:

```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

### Frontend Setup (React)

1. Navigate to the frontend directory:

```bash
cd dreams-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Features

- User authentication (register/login)
- Package browsing and details
- Booking management
- Admin dashboard for managing packages, bookings, and clients
- Personalized recommendations
- Client dashboard for viewing bookings

## Tech Stack

**Backend:**

- Laravel 10
- Laravel Sanctum (API authentication)
- MySQL/PostgreSQL

**Frontend:**

- React 18
- React Router DOM
- Axios
- Vite

## API Endpoints

See `dreams-backend/README.md` for detailed API documentation.
