# Quick Start: AI Auto-Fill Package Feature

## ⚡ Quick Setup (2 minutes)

### Step 1: Add OpenAI API Key

1. Open `dreams-backend/.env` file
2. Add this line at the end:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```
3. Get a free API key from: https://platform.openai.com/api-keys

### Step 2: Restart Backend Server

```bash
cd dreams-backend
php artisan serve
```

That's it! ✅

## 🎯 How to Use

1. **Login as Admin** (`admin@dreamsevents.com` / `admin123`)
2. **Go to**: Admin Dashboard → Manage Packages → **Create Package**
3. **Upload an image** of a package flyer/poster
4. **Click "Auto-Fill with AI"** button
5. **Wait 5-10 seconds** for AI to analyze
6. **Review** the auto-filled fields
7. **Adjust** if needed and create package!

## 📸 What Images Work Best?

- ✅ Package flyers or posters
- ✅ Event brochures with pricing
- ✅ Menu cards with inclusions
- ✅ Screenshots of package details
- ✅ Photos with visible text/prices

## 💡 Example Use Cases

**Before**: Manually type all package details
**After**: Upload flyer → AI reads everything → Done!

Perfect for:

- Importing existing packages from physical flyers
- Quick data entry from competitor packages
- Converting images to structured data

## 🆓 Free Tier

OpenAI provides:

- **$5 free credits** for new accounts
- Each image analysis costs **~$0.01-0.03**
- = **150-500 free package analyses**!

## ❓ No OpenAI Account?

The form still works normally! Just:

- Fill fields manually (like before)
- AI button simply won't work without API key

## 🎨 UI Preview

```
[Upload Image]
   ↓
[Image Preview] + [Auto-Fill with AI] Button
   ↓ (click button)
[🔄 Analyzing Image with AI...]
   ↓ (5-10 seconds)
[✅ Form Auto-Filled!]
```

## Need Help?

See full documentation: `AI_IMAGE_ANALYSIS_SETUP.md`
