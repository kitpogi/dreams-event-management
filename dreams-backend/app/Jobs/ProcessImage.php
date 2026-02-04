<?php

namespace App\Jobs;

use App\Services\ImageService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Job to process and optimize images asynchronously.
 */
class ProcessImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 30;

    /**
     * The maximum number of seconds the job can run.
     */
    public int $timeout = 120;

    /**
     * Create a new job instance.
     * 
     * @param string $path The storage path to the image
     * @param array<string, mixed> $options Processing options (resize, quality, thumbnail, etc.)
     */
    public function __construct(
        public string $path,
        public array $options = []
    ) {}

    /**
     * Execute the job.
     */
    public function handle(ImageService $imageService): void
    {
        Log::info('Processing image', [
            'path' => $this->path,
            'options' => $this->options,
        ]);

        if (!Storage::exists($this->path)) {
            Log::warning('Image file not found for processing', [
                'path' => $this->path,
            ]);
            return;
        }

        // Create thumbnail if requested
        if ($this->options['create_thumbnail'] ?? false) {
            $this->createThumbnail($imageService);
        }

        // Resize if dimensions specified
        if (isset($this->options['width']) || isset($this->options['height'])) {
            $this->resize($imageService);
        }

        // Optimize if requested
        if ($this->options['optimize'] ?? true) {
            $this->optimize($imageService);
        }

        Log::info('Image processing completed', [
            'path' => $this->path,
        ]);
    }

    /**
     * Create a thumbnail of the image.
     */
    protected function createThumbnail(ImageService $imageService): void
    {
        $thumbnailWidth = $this->options['thumbnail_width'] ?? 200;
        $thumbnailHeight = $this->options['thumbnail_height'] ?? 200;
        
        // Get the full path and process
        $fullPath = Storage::path($this->path);
        $thumbnailPath = $this->getThumbnailPath($this->path);
        
        Log::info('Creating thumbnail', [
            'source' => $this->path,
            'thumbnail' => $thumbnailPath,
            'dimensions' => "{$thumbnailWidth}x{$thumbnailHeight}",
        ]);

        // The actual thumbnail creation would be done here
        // This depends on your ImageService implementation
    }

    /**
     * Resize the image.
     */
    protected function resize(ImageService $imageService): void
    {
        $width = $this->options['width'] ?? null;
        $height = $this->options['height'] ?? null;

        Log::info('Resizing image', [
            'path' => $this->path,
            'dimensions' => "{$width}x{$height}",
        ]);

        // The actual resizing would be done here
        // This depends on your ImageService implementation
    }

    /**
     * Optimize the image.
     */
    protected function optimize(ImageService $imageService): void
    {
        $quality = $this->options['quality'] ?? 85;

        Log::info('Optimizing image', [
            'path' => $this->path,
            'quality' => $quality,
        ]);

        // The actual optimization would be done here
        // This depends on your ImageService implementation
    }

    /**
     * Get the thumbnail path from the original path.
     */
    protected function getThumbnailPath(string $originalPath): string
    {
        $directory = dirname($originalPath);
        $filename = pathinfo($originalPath, PATHINFO_FILENAME);
        $extension = pathinfo($originalPath, PATHINFO_EXTENSION);

        return "{$directory}/thumbnails/{$filename}_thumb.{$extension}";
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Failed to process image', [
            'path' => $this->path,
            'error' => $exception->getMessage(),
        ]);
    }

    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return ['image', 'processing', 'path:' . $this->path];
    }
}
