<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageService
{
    protected $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver());
    }

    /**
     * Process and store an uploaded image
     * 
     * @param UploadedFile $file
     * @param string $directory
     * @param int|null $maxWidth Maximum width (null = no resize)
     * @param int|null $maxHeight Maximum height (null = no resize)
     * @param int $quality JPEG quality (1-100)
     * @return string Path to stored image
     */
    public function processAndStore(
        UploadedFile $file,
        string $directory = 'images',
        ?int $maxWidth = 1920,
        ?int $maxHeight = 1080,
        int $quality = 85
    ): string {
        // Create image instance
        $image = $this->manager->read($file->getRealPath());

        // Get original dimensions
        $originalWidth = $image->width();
        $originalHeight = $image->height();

        // Resize if needed (maintain aspect ratio)
        if ($maxWidth && $maxHeight) {
            if ($originalWidth > $maxWidth || $originalHeight > $maxHeight) {
                $image->scaleDown($maxWidth, $maxHeight);
            }
        } elseif ($maxWidth && $originalWidth > $maxWidth) {
            $image->scaleDown($maxWidth);
        } elseif ($maxHeight && $originalHeight > $maxHeight) {
            $image->scaleDown(null, $maxHeight);
        }

        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = uniqid() . '_' . time() . '.' . $extension;
        $path = $directory . '/' . $filename;

        // Encode and save
        $encoded = $image->encode();
        Storage::disk('public')->put($path, $encoded);

        return $path;
    }

    /**
     * Create thumbnail version of an image
     * 
     * @param string $imagePath Path to existing image
     * @param int $width Thumbnail width
     * @param int $height Thumbnail height
     * @return string Path to thumbnail
     */
    public function createThumbnail(string $imagePath, int $width = 300, int $height = 300): string
    {
        $fullPath = Storage::disk('public')->path($imagePath);
        
        if (!file_exists($fullPath)) {
            throw new \Exception("Image not found: {$imagePath}");
        }

        $image = $this->manager->read($fullPath);
        $image->cover($width, $height);

        // Generate thumbnail path
        $pathInfo = pathinfo($imagePath);
        $thumbnailPath = $pathInfo['dirname'] . '/thumbs/' . $pathInfo['filename'] . '_thumb.' . $pathInfo['extension'];

        $encoded = $image->encode();
        Storage::disk('public')->put($thumbnailPath, $encoded);

        return $thumbnailPath;
    }

    /**
     * Delete an image and its thumbnail if exists
     * 
     * @param string $imagePath
     * @return bool
     */
    public function deleteImage(string $imagePath): bool
    {
        if (Storage::disk('public')->exists($imagePath)) {
            Storage::disk('public')->delete($imagePath);
        }

        // Try to delete thumbnail
        $pathInfo = pathinfo($imagePath);
        $thumbnailPath = $pathInfo['dirname'] . '/thumbs/' . $pathInfo['filename'] . '_thumb.' . $pathInfo['extension'];
        
        if (Storage::disk('public')->exists($thumbnailPath)) {
            Storage::disk('public')->delete($thumbnailPath);
        }

        return true;
    }
}

