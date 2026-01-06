# Vercel Deployment Guide

Complete guide for deploying the Dreams Frontend application to Vercel.

## 🚀 Quick Start (Recommended Path)

**You only need to follow ONE method per section!** Here's the easiest path:

1. **Prerequisites** - Make sure you have everything listed
2. **Initial Setup** - Test your build locally
3. **Deploy via Dashboard** (Option 1) - Easiest method, no CLI needed
   - Import your Git repo in Vercel Dashboard
   - Set environment variable `VITE_API_BASE_URL` in the dashboard
   - Click Deploy
4. **Done!** - Your site will be live

**That's it!** The other methods (CLI, automatic deployments) are alternatives if you prefer them.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Variables](#environment-variables)
4. [Deployment Steps](#deployment-steps)
5. [Configuration Details](#configuration-details)
6. [Troubleshooting](#troubleshooting)
7. [Post-Deployment](#post-deployment)

---

## Prerequisites

Before deploying to Vercel, ensure you have:

- ✅ A Vercel account ([sign up here](https://vercel.com/signup))
- ✅ Git repository (GitHub, GitLab, or Bitbucket)
- ✅ Your project pushed to the repository
- ✅ Node.js 18+ installed locally (for testing builds)
- ✅ Backend API URL ready for production

---

## Initial Setup

### 1. Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### 2. Verify Your Project Structure

Ensure your project has:

- ✅ `package.json` with build scripts
- ✅ `vercel.json` configuration file (already present)
- ✅ `vite.config.js` properly configured
- ✅ `.gitignore` includes `node_modules`, `.env.local`, `dist`

### 3. Test Build Locally

Before deploying, test your build:

```bash
cd dreams-frontend
npm install
npm run build
```

Verify the `dist` folder is created successfully.

---

## Environment Variables

### Required Environment Variables

Your application requires the following environment variable:

| Variable            | Description          | Example                          |
| ------------------- | -------------------- | -------------------------------- |
| `VITE_API_BASE_URL` | Backend API base URL | `https://api.yourdomain.com/api` |

### Setting Environment Variables in Vercel

> **Note**: Choose ONE method below. Method 1 (Dashboard) is recommended and easiest.

#### Method 1: Via Vercel Dashboard (Recommended)

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: Your production API URL (e.g., `https://api.yourdomain.com/api`)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

#### Method 2: Via Vercel CLI

```bash
cd dreams-frontend
vercel env add VITE_API_BASE_URL
# Enter your API URL when prompted
# Select environments: Production, Preview, Development
```

#### Method 3: Via `.env` File (Not Recommended for Production)

Create a `.env.production` file (don't commit this):

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

**Note**: Vercel automatically uses environment variables from the dashboard, which is more secure.

---

## Deployment Steps

> **Note**: Choose ONE option below. Option 1 (Dashboard) is the easiest for first-time deployment. Option 3 (Automatic) is best for ongoing development.

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Import Your Project**

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **Add New** → **Project**
   - Import your Git repository (GitHub/GitLab/Bitbucket)
   - Select the repository containing your `dreams-frontend` folder

2. **Configure Project Settings**

   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `dreams-frontend` (if your repo contains multiple projects)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

3. **Add Environment Variables**

   - Click **Environment Variables** section
   - Add `VITE_API_BASE_URL` with your production API URL
   - Ensure it's enabled for Production, Preview, and Development

4. **Deploy**
   - Click **Deploy**
   - Wait for the build to complete
   - Your site will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Login to Vercel**

   ```bash
   cd dreams-frontend
   vercel login
   ```

2. **Link Your Project**

   ```bash
   vercel link
   ```

   - Follow prompts to link to existing project or create new one

3. **Set Environment Variables**

   ```bash
   vercel env add VITE_API_BASE_URL production
   vercel env add VITE_API_BASE_URL preview
   vercel env add VITE_API_BASE_URL development
   ```

4. **Deploy to Production**

   ```bash
   vercel --prod
   ```

   Or deploy to preview:

   ```bash
   vercel
   ```

### Option 3: Automatic Deployments (Recommended)

Once connected to Git, Vercel automatically deploys:

- **Production**: Every push to `main` or `master` branch
- **Preview**: Every push to other branches and pull requests

No manual deployment needed!

---

## Configuration Details

### Current `vercel.json` Configuration

Your `vercel.json` is already configured with:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**What this does:**

- ✅ Configures Vite framework
- ✅ Sets build output to `dist` folder
- ✅ Enables SPA routing (all routes redirect to `index.html`)
- ✅ Caches static assets for 1 year (performance optimization)

### Custom Domain Setup

1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `app.yourdomain.com`)
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificates

---

## Troubleshooting

### Build Fails

**Issue**: Build fails with errors

**Solutions**:

1. Check build logs in Vercel dashboard
2. Test build locally: `npm run build`
3. Ensure all dependencies are in `package.json`
4. Check Node.js version (Vercel uses Node 18+ by default)

**Set Node.js Version** (if needed):
Add to `package.json`:

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Environment Variables Not Working

**Issue**: API calls fail or use wrong URL

**Solutions**:

1. Verify environment variables are set in Vercel dashboard
2. Ensure variable names start with `VITE_` (required for Vite)
3. Redeploy after adding/changing environment variables
4. Check browser console for actual API URL being used

### Routing Issues (404 on Refresh)

**Issue**: Direct URL access or refresh returns 404

**Solution**: Already configured! The `rewrites` in `vercel.json` handle this:

```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

### CORS Errors

**Issue**: CORS errors when calling API

**Solutions**:

1. Ensure backend API allows your Vercel domain
2. Add Vercel domain to backend CORS whitelist:
   - `https://your-project.vercel.app`
   - `https://your-custom-domain.com`
3. Check API response headers include proper CORS headers

### Build Timeout

**Issue**: Build exceeds time limit

**Solutions**:

1. Optimize dependencies (remove unused packages)
2. Check for large files in `public` folder
3. Consider upgrading Vercel plan if needed
4. Review build logs for slow operations

### Assets Not Loading

**Issue**: Images or assets return 404

**Solutions**:

1. Ensure assets are in `public` folder or imported in code
2. Check asset paths are relative (not absolute local paths)
3. Verify `dist` folder contains all assets after build
4. Check browser network tab for actual asset URLs

---

## Post-Deployment

### 1. Verify Deployment

- ✅ Visit your Vercel URL
- ✅ Test all major features
- ✅ Check browser console for errors
- ✅ Verify API calls are working
- ✅ Test authentication flow
- ✅ Test routing (navigate and refresh pages)

### 2. Set Up Monitoring

- Enable **Analytics** in Vercel dashboard
- Set up **Error Tracking** (if using Sentry or similar)
- Monitor build logs for warnings

### 3. Performance Optimization

Your configuration already includes:

- ✅ Asset caching (1 year for `/assets/*`)
- ✅ Code splitting (configured in `vite.config.js`)
- ✅ Minification (esbuild)

Additional optimizations:

- Enable **Vercel Analytics** for performance insights
- Use **Image Optimization** for images
- Consider **Edge Functions** for API routes

### 4. Continuous Deployment

Vercel automatically:

- ✅ Deploys on every push to main branch
- ✅ Creates preview deployments for PRs
- ✅ Runs builds in isolated environments
- ✅ Provides deployment URLs for each commit

### 5. Rollback Deployment

If something goes wrong:

1. Go to **Deployments** tab
2. Find the last working deployment
3. Click **⋯** (three dots) → **Promote to Production**

---

## Advanced Configuration

### Custom Build Settings

If you need to customize build settings, you can override in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci", // Use ci for faster, reliable builds
  "framework": "vite",
  "nodeVersion": "18.x" // Specify Node version
}
```

### Preview Environment Variables

Set different API URLs for preview deployments:

1. Go to **Settings** → **Environment Variables**
2. Add `VITE_API_BASE_URL` for **Preview** environment
3. Use staging API URL for previews
4. Use production API URL for production

### Headers Configuration

Add security headers (optional):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## Quick Reference

### Essential Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs

# Remove deployment
vercel remove
```

### Important URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Documentation**: https://vercel.com/docs
- **CLI Reference**: https://vercel.com/docs/cli

### Support

- **Vercel Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/vercel/discussions
- **Status Page**: https://www.vercel-status.com

---

## Checklist

Before deploying, ensure:

- [ ] Project builds successfully locally (`npm run build`)
- [ ] All environment variables are set in Vercel
- [ ] Backend API is accessible and CORS is configured
- [ ] `vercel.json` is properly configured
- [ ] Git repository is connected
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active (automatic with Vercel)
- [ ] All routes work correctly (test navigation and refresh)
- [ ] API calls are working
- [ ] Authentication flow works
- [ ] Error handling is tested

---

## Next Steps

After successful deployment:

1. **Set up custom domain** (if needed)
2. **Configure analytics** for monitoring
3. **Set up error tracking** (Sentry, etc.)
4. **Enable preview deployments** for testing
5. **Configure webhooks** for CI/CD integration
6. **Set up environment-specific configs** (staging, production)

---

**Last Updated**: Based on current project configuration
**Project**: Dreams Frontend (Vite + React)
**Framework**: Vite 7.2.6
