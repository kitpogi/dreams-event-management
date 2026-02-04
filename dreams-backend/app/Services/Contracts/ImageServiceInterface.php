<?php

namespace App\Services\Contracts;

use App\Models\User;
use Illuminate\Http\UploadedFile;

/**
 * Contract for Image Service operations.
 */
interface ImageServiceInterface
{
    /**
     * Upload an image file.
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param array $options
     * @return string The stored file path
     */
    public function upload(UploadedFile $file, string $directory, array $options = []): string;

    /**
     * Delete an image.
     *
     * @param string $path
     * @return bool
     */
    public function delete(string $path): bool;

    /**
     * Resize an image.
     *
     * @param string $path
     * @param int $width
     * @param int|null $height
     * @return string The resized image path
     */
    public function resize(string $path, int $width, ?int $height = null): string;

    /**
     * Generate a thumbnail.
     *
     * @param string $path
     * @param int $size
     * @return string The thumbnail path
     */
    public function thumbnail(string $path, int $size = 150): string;

    /**
     * Optimize an image.
     *
     * @param string $path
     * @param int $quality
     * @return string
     */
    public function optimize(string $path, int $quality = 80): string;

    /**
     * Get image URL.
     *
     * @param string $path
     * @return string
     */
    public function getUrl(string $path): string;

    /**
     * Validate image file.
     *
     * @param UploadedFile $file
     * @param array $rules
     * @return bool
     */
    public function validate(UploadedFile $file, array $rules = []): bool;
}
