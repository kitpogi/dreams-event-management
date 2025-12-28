# Deploying Dreams Frontend to Vercel

This guide will help you deploy the Dreams frontend application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your backend API deployed and accessible (see Backend Deployment section)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Important Note About Backend

⚠️ **Vercel does not support PHP/Laravel backends**. Your `dreams-backend` (Laravel) needs to be deployed separately to a service that supports PHP, such as:
- **Railway** (recommended for easy deployment)
- **Render**
- **DigitalOcean App Platform**
- **Traditional VPS** (like DigitalOcean Droplet, AWS EC2, etc.)

Once your backend is deployed, you'll use its URL for the `VITE_API_BASE_URL` environment variable.

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - **Important**: Set the **Root Directory** to `dreams-frontend`
   - Click "Deploy"

3. **Configure Environment Variables**
   - After the initial deployment, go to your project settings
   - Navigate to "Environment Variables"
   - Add the following variables:
     ```
     VITE_API_BASE_URL=https://your-backend-url.com/api
     VITE_APP_NAME=D'Dreams Events
     ```
   - Replace `https://your-backend-url.com/api` with your actual deployed backend URL
   - Make sure to add these for **Production**, **Preview**, and **Development** environments

4. **Redeploy**
   - After adding environment variables, trigger a new deployment
   - Go to "Deployments" tab and click "Redeploy" on the latest deployment

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Navigate to frontend directory**
   ```bash
   cd dreams-frontend
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```

4. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked for root directory, confirm it's `.` (current directory)
   - When asked to override settings, you can say "No" (we have vercel.json)

5. **Set Environment Variables**
   ```bash
   vercel env add VITE_API_BASE_URL
   # Enter: https://your-backend-url.com/api
   # Select: Production, Preview, Development
   
   vercel env add VITE_APP_NAME
   # Enter: D'Dreams Events
   # Select: Production, Preview, Development
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Configuration Details

The `vercel.json` file is already configured with:
- **Build Command**: `npm run build`
- **Output Directory**: `dist` (Vite's default output)
- **Framework**: Vite
- **SPA Routing**: All routes redirect to `index.html` for client-side routing
- **Asset Caching**: Static assets are cached for optimal performance

## Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Your deployed backend API URL | `https://api.example.com/api` |
| `VITE_APP_NAME` | Application name (optional) | `D'Dreams Events` |

## Backend Deployment Options

### Option 1: Railway (Easiest)

1. Sign up at [railway.app](https://railway.app)
2. Create a new project
3. Connect your Git repository
4. Set root directory to `dreams-backend`
5. Railway will auto-detect Laravel
6. Add environment variables from your `.env` file
7. Deploy!

### Option 2: Render

1. Sign up at [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your repository
4. Set:
   - **Build Command**: `composer install --no-dev --optimize-autoloader`
   - **Start Command**: `php -S 0.0.0.0:$PORT -t public`
   - **Environment**: PHP
5. Add environment variables
6. Deploy!

### Option 3: DigitalOcean App Platform

1. Sign up at [digitalocean.com](https://digitalocean.com)
2. Create a new App
3. Connect your repository
4. Select PHP as the runtime
5. Configure build and start commands
6. Add environment variables
7. Deploy!

## Post-Deployment Checklist

- [ ] Backend is deployed and accessible
- [ ] `VITE_API_BASE_URL` points to your deployed backend
- [ ] CORS is configured on your backend to allow your Vercel domain
- [ ] Environment variables are set in Vercel
- [ ] Test authentication flow
- [ ] Test API calls from the frontend
- [ ] Verify email functionality works (if using email services)

## CORS Configuration

Make sure your Laravel backend's `config/cors.php` allows requests from your Vercel domain:

```php
'allowed_origins' => [
    'https://your-app.vercel.app',
    // Add your Vercel domain here
],
```

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node.js version is compatible (Vercel uses Node 18+ by default)

### API Calls Fail
- Verify `VITE_API_BASE_URL` is set correctly
- Check CORS configuration on backend
- Ensure backend is accessible from the internet

### Routing Issues
- The `vercel.json` already includes SPA routing configuration
- If routes don't work, check the rewrite rules

### Environment Variables Not Working
- Remember: Vite requires `VITE_` prefix for environment variables
- After adding env vars, you must redeploy
- Check that variables are added for the correct environment (Production/Preview/Development)

## Custom Domain

To add a custom domain:
1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your domain
4. Follow DNS configuration instructions

## Support

For Vercel-specific issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Discord](https://vercel.com/discord)

