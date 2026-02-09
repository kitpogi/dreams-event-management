<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Drivers\Imagick\Driver as ImagickDriver;
use Exception;

class ImageService
{
    protected $manager;
    protected $hasDriver = false;

    public function __construct()
    {
        try {
            if (extension_loaded('gd')) {
                $this->manager = new ImageManager(new Driver());
                $this->hasDriver = true;
            } elseif (extension_loaded('imagick')) {
                $this->manager = new ImageManager(new ImagickDriver());
                $this->hasDriver = true;
            }
        } catch (Exception $e) {
            $this->hasDriver = false;
        }
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
        // If no image driver is available, just store the file as is
        if (!$this->hasDriver) {
            $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
            return $file->storeAs($directory, $filename, 'public');
        }

        try {
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

            // Generate unique filename - always use .webp for better performance
            $filename = uniqid() . '_' . time() . '.webp';
            $path = $directory . '/' . $filename;

            // Encode to webp with specified quality
            $encoded = $image->toWebp($quality);
            Storage::disk('public')->put($path, (string) $encoded);

            return $path;
        } catch (Exception $e) {
            // Fallback to basic storage if processing fails
            $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
            return $file->storeAs($directory, $filename, 'public');
        }
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
        if (!$this->hasDriver) {
            // Can't create thumbnail without driver, return original path
            return $imagePath;
        }

        try {
            $fullPath = Storage::disk('public')->path($imagePath);

            if (!file_exists($fullPath)) {
                return $imagePath;
            }

            $image = $this->manager->read($fullPath);
            $image->cover($width, $height);

            // Generate thumbnail path - always use .webp
            $pathInfo = pathinfo($imagePath);
            $thumbnailPath = $pathInfo['dirname'] . '/thumbs/' . $pathInfo['filename'] . '_thumb.webp';

            $encoded = $image->toWebp(75); // Lower quality for thumbnails
            Storage::disk('public')->put($thumbnailPath, (string) $encoded);

            return $thumbnailPath;
        } catch (Exception $e) {
            return $imagePath;
        }
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

