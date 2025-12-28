# AI Image Analysis Setup Guide

This feature allows administrators to upload a package image (flyer/poster) and automatically extract package information using OpenAI's Vision API.

## Prerequisites

1. An OpenAI API account with access to Vision models
2. OpenAI API key

## Setup Instructions

### 1. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the generated API key

### 2. Configure Backend

Add the following to your `dreams-backend/.env` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Replace `your_openai_api_key_here` with your actual OpenAI API key.

### 3. Test the Feature

1. Log in as an admin user
2. Navigate to **Admin Dashboard → Manage Packages → Create Package**
3. Upload an image of a package flyer or poster
4. Click the **"Auto-Fill with AI"** button
5. Wait for the analysis to complete (usually 5-15 seconds)
6. Review and adjust the auto-filled form fields as needed

## How It Works

1. **Upload Image**: Admin uploads a package image (flyer, poster, brochure, etc.)
2. **AI Analysis**: The image is sent to OpenAI's GPT-4 Vision model
3. **Data Extraction**: AI extracts:
   - Package name
   - Description
   - Price
   - Capacity
   - Event type (wedding, birthday, etc.)
   - Theme/style
   - Inclusions/features
4. **Auto-Fill**: Extracted data automatically fills the form fields
5. **Review & Submit**: Admin reviews, adjusts if needed, and creates the package

## Supported Image Formats

- JPEG/JPG
- PNG
- WebP
- Max file size: 10MB

## API Cost Considerations

- The feature uses OpenAI's GPT-4o-mini model (cost-effective)
- Approximate cost: $0.01 - $0.03 per image analysis
- Monthly costs depend on usage volume

## Tips for Best Results

1. **Use Clear Images**: High-resolution images with readable text work best
2. **Structured Content**: Images with organized information (like flyers) are ideal
3. **Text-Heavy Images**: The more details in the image, the better the extraction
4. **Review Output**: Always review AI-extracted data for accuracy

## Troubleshooting

### Error: "OpenAI API key not configured"

**Solution**: Add `OPENAI_API_KEY` to your `.env` file and restart the server

### Error: "Failed to analyze image with AI service"

**Solution**:

- Check your OpenAI API key is valid
- Verify you have API credits available
- Check your internet connection

### Image Analysis Returns Empty Fields

**Solution**:

- Try a different image with clearer text
- Ensure the image contains relevant package information
- Manually fill any missing fields

## Security Notes

- API key is stored securely in `.env` file (never commit to version control)
- Image analysis happens on the backend (API key never exposed to frontend)
- Images are sent to OpenAI but not permanently stored by OpenAI

## Alternative: Manual Entry

If AI analysis is unavailable or returns poor results, admins can always fill the form manually as before. The AI feature is optional and enhances the user experience.

## Support

For issues or questions about this feature, contact the development team.
