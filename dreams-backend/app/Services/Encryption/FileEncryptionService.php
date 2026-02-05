<?php

namespace App\Services\Encryption;

use App\Services\Contracts\FileEncryptionServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Service for encrypting and decrypting uploaded files.
 * 
 * Uses AES-256-GCM encryption for secure file storage.
 * Stores encrypted files with metadata for decryption.
 */
class FileEncryptionService implements FileEncryptionServiceInterface
{
    /**
     * Encryption algorithm.
     */
    protected const CIPHER = 'aes-256-gcm';

    /**
     * IV length for AES-GCM.
     */
    protected const IV_LENGTH = 12;

    /**
     * Tag length for AES-GCM.
     */
    protected const TAG_LENGTH = 16;

    /**
     * Metadata file extension.
     */
    protected const METADATA_EXT = '.meta';

    /**
     * Encrypted file extension.
     */
    protected const ENCRYPTED_EXT = '.enc';

    /**
     * Chunk size for streaming encryption (1MB).
     */
    protected const CHUNK_SIZE = 1048576;

    /**
     * Default storage disk.
     */
    protected string $defaultDisk;

    /**
     * Encryption key.
     */
    protected string $encryptionKey;

    public function __construct()
    {
        $this->defaultDisk = config('filesystems.default', 'local');
        $this->encryptionKey = $this->deriveKey(config('app.key'));
    }

    /**
     * Encrypt and store a file.
     *
     * @param UploadedFile $file The uploaded file
     * @param string $path Storage path (relative to disk root)
     * @param string|null $disk Storage disk name
     * @return array File metadata including path and encryption info
     */
    public function encryptAndStore(UploadedFile $file, string $path, ?string $disk = null): array
    {
        $disk = $disk ?? $this->defaultDisk;
        $storage = Storage::disk($disk);

        // Generate unique filename
        $filename = $this->generateSecureFilename($file);
        $encryptedPath = rtrim($path, '/') . '/' . $filename . self::ENCRYPTED_EXT;
        $metadataPath = rtrim($path, '/') . '/' . $filename . self::METADATA_EXT;

        // Generate IV
        $iv = random_bytes(self::IV_LENGTH);

        // Read file contents
        $plaintext = file_get_contents($file->getRealPath());

        // Encrypt the file
        $tag = '';
        $ciphertext = openssl_encrypt(
            $plaintext,
            self::CIPHER,
            $this->encryptionKey,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            self::TAG_LENGTH
        );

        if ($ciphertext === false) {
            throw new \RuntimeException('Failed to encrypt file.');
        }

        // Combine IV + ciphertext + tag
        $encryptedData = $iv . $ciphertext . $tag;

        // Store encrypted file
        $storage->put($encryptedPath, $encryptedData);

        // Prepare metadata
        $metadata = [
            'original_name' => $file->getClientOriginalName(),
            'original_extension' => $file->getClientOriginalExtension(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'encrypted_path' => $encryptedPath,
            'encrypted_at' => now()->toIso8601String(),
            'algorithm' => self::CIPHER,
            'checksum' => hash('sha256', $plaintext),
        ];

        // Store metadata
        $storage->put($metadataPath, json_encode($metadata, JSON_PRETTY_PRINT));

        Log::info('File encrypted and stored', [
            'original_name' => $file->getClientOriginalName(),
            'encrypted_path' => $encryptedPath,
            'size' => $file->getSize(),
        ]);

        return [
            'path' => $encryptedPath,
            'metadata_path' => $metadataPath,
            'disk' => $disk,
            'filename' => $filename,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ];
    }

    /**
     * Decrypt and retrieve a file.
     *
     * @param string $path Path to the encrypted file
     * @param string|null $disk Storage disk name
     * @return string Decrypted file contents
     */
    public function decryptAndRetrieve(string $path, ?string $disk = null): string
    {
        $disk = $disk ?? $this->defaultDisk;
        $storage = Storage::disk($disk);

        if (!$storage->exists($path)) {
            throw new \RuntimeException('Encrypted file not found.');
        }

        $encryptedData = $storage->get($path);

        // Extract IV, ciphertext, and tag
        $iv = substr($encryptedData, 0, self::IV_LENGTH);
        $tag = substr($encryptedData, -self::TAG_LENGTH);
        $ciphertext = substr($encryptedData, self::IV_LENGTH, -self::TAG_LENGTH);

        // Decrypt
        $plaintext = openssl_decrypt(
            $ciphertext,
            self::CIPHER,
            $this->encryptionKey,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        if ($plaintext === false) {
            throw new \RuntimeException('Failed to decrypt file. Data may be corrupted or tampered with.');
        }

        // Verify checksum if metadata exists
        $metadataPath = str_replace(self::ENCRYPTED_EXT, self::METADATA_EXT, $path);
        if ($storage->exists($metadataPath)) {
            $metadata = json_decode($storage->get($metadataPath), true);
            if (isset($metadata['checksum'])) {
                $actualChecksum = hash('sha256', $plaintext);
                if (!hash_equals($metadata['checksum'], $actualChecksum)) {
                    throw new \RuntimeException('File integrity check failed.');
                }
            }
        }

        return $plaintext;
    }

    /**
     * Stream a decrypted file to output.
     *
     * @param string $path Path to the encrypted file
     * @param string|null $disk Storage disk name
     * @return resource Stream resource
     */
    public function streamDecrypted(string $path, ?string $disk = null)
    {
        // For simplicity, we'll return the decrypted content as a stream
        // In a production environment, you might want to implement chunked decryption
        $decrypted = $this->decryptAndRetrieve($path, $disk);

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $decrypted);
        rewind($stream);

        return $stream;
    }

    /**
     * Delete an encrypted file.
     *
     * @param string $path Path to the encrypted file
     * @param string|null $disk Storage disk name
     * @return bool
     */
    public function delete(string $path, ?string $disk = null): bool
    {
        $disk = $disk ?? $this->defaultDisk;
        $storage = Storage::disk($disk);

        $deleted = $storage->delete($path);

        // Also delete metadata file
        $metadataPath = str_replace(self::ENCRYPTED_EXT, self::METADATA_EXT, $path);
        if ($storage->exists($metadataPath)) {
            $storage->delete($metadataPath);
        }

        if ($deleted) {
            Log::info('Encrypted file deleted', ['path' => $path]);
        }

        return $deleted;
    }

    /**
     * Check if file exists.
     *
     * @param string $path Path to check
     * @param string|null $disk Storage disk name
     * @return bool
     */
    public function exists(string $path, ?string $disk = null): bool
    {
        $disk = $disk ?? $this->defaultDisk;
        return Storage::disk($disk)->exists($path);
    }

    /**
     * Get file metadata.
     *
     * @param string $path Path to the file
     * @param string|null $disk Storage disk name
     * @return array|null
     */
    public function getMetadata(string $path, ?string $disk = null): ?array
    {
        $disk = $disk ?? $this->defaultDisk;
        $storage = Storage::disk($disk);

        $metadataPath = str_replace(self::ENCRYPTED_EXT, self::METADATA_EXT, $path);

        if (!$storage->exists($metadataPath)) {
            return null;
        }

        return json_decode($storage->get($metadataPath), true);
    }

    /**
     * Re-encrypt a file with a new key.
     *
     * @param string $path Path to the file
     * @param string|null $disk Storage disk name
     * @return bool
     */
    public function reEncrypt(string $path, ?string $disk = null): bool
    {
        $disk = $disk ?? $this->defaultDisk;
        $storage = Storage::disk($disk);

        try {
            // Decrypt with current key
            $plaintext = $this->decryptAndRetrieve($path, $disk);

            // Generate new IV
            $iv = random_bytes(self::IV_LENGTH);

            // Encrypt with (possibly new) key
            $tag = '';
            $ciphertext = openssl_encrypt(
                $plaintext,
                self::CIPHER,
                $this->encryptionKey,
                OPENSSL_RAW_DATA,
                $iv,
                $tag,
                '',
                self::TAG_LENGTH
            );

            if ($ciphertext === false) {
                return false;
            }

            // Combine and store
            $encryptedData = $iv . $ciphertext . $tag;
            $storage->put($path, $encryptedData);

            // Update metadata
            $metadataPath = str_replace(self::ENCRYPTED_EXT, self::METADATA_EXT, $path);
            if ($storage->exists($metadataPath)) {
                $metadata = json_decode($storage->get($metadataPath), true);
                $metadata['re_encrypted_at'] = now()->toIso8601String();
                $metadata['checksum'] = hash('sha256', $plaintext);
                $storage->put($metadataPath, json_encode($metadata, JSON_PRETTY_PRINT));
            }

            Log::info('File re-encrypted', ['path' => $path]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to re-encrypt file', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Generate a download response for an encrypted file.
     *
     * @param string $path Path to the encrypted file
     * @param string|null $disk Storage disk name
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function download(string $path, ?string $disk = null)
    {
        $metadata = $this->getMetadata($path, $disk);
        $content = $this->decryptAndRetrieve($path, $disk);

        $filename = $metadata['original_name'] ?? basename($path);
        $mimeType = $metadata['mime_type'] ?? 'application/octet-stream';

        return response()->streamDownload(function () use ($content) {
            echo $content;
        }, $filename, [
            'Content-Type' => $mimeType,
            'Content-Length' => strlen($content),
        ]);
    }

    /**
     * Create an inline response for viewing encrypted files (like images).
     *
     * @param string $path Path to the encrypted file
     * @param string|null $disk Storage disk name
     * @return \Illuminate\Http\Response
     */
    public function inline(string $path, ?string $disk = null)
    {
        $metadata = $this->getMetadata($path, $disk);
        $content = $this->decryptAndRetrieve($path, $disk);

        $mimeType = $metadata['mime_type'] ?? 'application/octet-stream';

        return response($content, 200, [
            'Content-Type' => $mimeType,
            'Content-Length' => strlen($content),
            'Content-Disposition' => 'inline',
        ]);
    }

    /**
     * Derive encryption key from Laravel app key.
     */
    protected function deriveKey(string $appKey): string
    {
        // Remove base64: prefix if present
        if (Str::startsWith($appKey, 'base64:')) {
            $appKey = base64_decode(substr($appKey, 7));
        }

        // Derive a 256-bit key using HKDF
        return hash_hkdf('sha256', $appKey, 32, 'file-encryption');
    }

    /**
     * Generate a secure filename.
     */
    protected function generateSecureFilename(UploadedFile $file): string
    {
        $timestamp = now()->format('YmdHis');
        $random = Str::random(16);
        return "{$timestamp}_{$random}";
    }

    /**
     * Encrypt a large file in chunks (for files > memory limit).
     *
     * @param string $sourcePath Path to source file
     * @param string $destinationPath Path for encrypted file
     * @param string|null $disk Storage disk name
     * @return array Metadata
     */
    public function encryptLargeFile(string $sourcePath, string $destinationPath, ?string $disk = null): array
    {
        $disk = $disk ?? $this->defaultDisk;
        $storage = Storage::disk($disk);

        // Generate IV for the file
        $iv = random_bytes(self::IV_LENGTH);

        // Read source file in chunks and encrypt
        $sourceHandle = fopen($sourcePath, 'rb');
        if (!$sourceHandle) {
            throw new \RuntimeException('Cannot open source file.');
        }

        $encryptedChunks = [$iv]; // Start with IV
        $totalSize = 0;
        $hasher = hash_init('sha256');

        while (!feof($sourceHandle)) {
            $chunk = fread($sourceHandle, self::CHUNK_SIZE);
            if ($chunk === false) {
                break;
            }

            hash_update($hasher, $chunk);
            $totalSize += strlen($chunk);

            // For simplicity, we'll use CBC for chunked encryption
            // Note: In production, consider using a streaming AEAD mode
            $encryptedChunk = openssl_encrypt(
                $chunk,
                'aes-256-cbc',
                $this->encryptionKey,
                OPENSSL_RAW_DATA,
                $iv
            );

            if ($encryptedChunk === false) {
                fclose($sourceHandle);
                throw new \RuntimeException('Failed to encrypt chunk.');
            }

            $encryptedChunks[] = $encryptedChunk;
        }

        fclose($sourceHandle);

        // Combine and store
        $encryptedData = implode('', $encryptedChunks);
        $storage->put($destinationPath, $encryptedData);

        $checksum = hash_final($hasher);

        // Store metadata
        $metadataPath = str_replace(self::ENCRYPTED_EXT, self::METADATA_EXT, $destinationPath);
        $metadata = [
            'original_size' => $totalSize,
            'encrypted_path' => $destinationPath,
            'encrypted_at' => now()->toIso8601String(),
            'algorithm' => 'aes-256-cbc', // Different for chunked
            'checksum' => $checksum,
            'chunked' => true,
        ];
        $storage->put($metadataPath, json_encode($metadata, JSON_PRETTY_PRINT));

        return $metadata;
    }
}
