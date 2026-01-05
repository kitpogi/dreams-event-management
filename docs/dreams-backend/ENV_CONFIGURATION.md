# Environment Configuration Guide

This document describes the environment variables required for the Dreams backend application.

## Required Environment Variables

### Application Configuration

```env
APP_NAME=Dreams
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000
```

### Database Configuration

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dreamsdb
DB_USERNAME=root
DB_PASSWORD=
```

### CORS Configuration

```env
# Comma-separated list of allowed origins for CORS
# Example: http://localhost:3000,https://yourdomain.com
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Note:** If `CORS_ALLOWED_ORIGINS` is not set, CORS will be disabled (empty array). This is intentional to prevent accidental exposure in production.

### Sanctum Configuration

```env
# Comma-separated list of stateful domains for Sanctum SPA authentication
# Example: localhost,localhost:3000,yourdomain.com
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000
```

**Note:** If `SANCTUM_STATEFUL_DOMAINS` is not set, it will default to the current application URL with port. It's recommended to explicitly set this for development and production.

### Session Configuration (if using sessions)

```env
SESSION_DRIVER=file
SESSION_LIFETIME=120
```

## Setup Instructions

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Generate application key:

   ```bash
   php artisan key:generate
   ```

3. Update the environment variables above with your specific values.

4. For production:
   - Set `APP_ENV=production`
   - Set `APP_DEBUG=false`
   - Configure `CORS_ALLOWED_ORIGINS` with your production frontend URL(s)
   - Configure `SANCTUM_STATEFUL_DOMAINS` with your production domain(s)
   - Use secure database credentials
   - Use secure session driver (e.g., `redis` or `database`)
