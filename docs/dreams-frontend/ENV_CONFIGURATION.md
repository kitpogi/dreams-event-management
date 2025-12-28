# Frontend Environment Configuration Guide

This document describes the environment variables required for the Dreams frontend application.

## Required Environment Variables

### API Configuration

```env
# API Base URL - The full URL to your backend API
# This is REQUIRED - the application will not start without it
VITE_API_BASE_URL=http://localhost:8000/api
```

**Important:** This variable is required. The application will not start without it.

### OAuth Configuration (Optional but Recommended)

```env
# Google OAuth Client ID
# Get this from: https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Facebook App ID
# Get this from: https://developers.facebook.com/apps/
VITE_FACEBOOK_APP_ID=your-facebook-app-id
```

**Note:** OAuth login will work without these credentials, but users will see an error message. To enable Google and Facebook login, you need to set up OAuth applications with these providers.

### Development Server Configuration (Optional)

```env
# Development Server Port (optional, defaults to 5173)
VITE_DEV_SERVER_PORT=5173

# API Proxy Target (optional, used by Vite dev server proxy)
# This should be the base URL without /api
# If not set, it will try to derive from VITE_API_BASE_URL
VITE_API_PROXY_TARGET=http://localhost:8000
```

## Setup Instructions

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Update `VITE_API_BASE_URL` with your backend API URL:

   - Development: `http://localhost:8000/api`
   - Production: `https://api.yourdomain.com/api`

3. (Optional) Set up OAuth credentials:

   **Google OAuth Setup:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins: `http://localhost:5173` (for dev) and your production domain
   - Add authorized redirect URIs: `http://localhost:5173` (for dev) and your production domain
   - Copy the Client ID and add it to `.env` as `VITE_GOOGLE_CLIENT_ID`

   **Facebook OAuth Setup:**

   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Add "Facebook Login" product
   - Go to Settings → Basic
   - Add your site URL: `http://localhost:5173` (for dev) and your production domain
   - Copy the App ID and add it to `.env` as `VITE_FACEBOOK_APP_ID`

4. For production builds:
   - Set `VITE_API_BASE_URL` to your production API URL
   - Set your OAuth credentials for production
   - Build the application: `npm run build`
   - The environment variables are embedded at build time

## Environment-Specific Examples

### Local Development

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_DEV_SERVER_PORT=5173
VITE_API_PROXY_TARGET=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your-facebook-app-id
```

### Production

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your-production-facebook-app-id
```

## Notes

- Vite requires the `VITE_` prefix for environment variables to be exposed to the client
- Environment variables are embedded at build time, not runtime
- For different environments, you may need separate build processes or use a CI/CD pipeline to inject the correct values
