<?php

namespace App\Services\Contracts;

use Illuminate\Http\UploadedFile;

/**
 * Contract for File Encryption Service operations.
 */
interface FileEncryptionServiceInterface
{
    /**
     * Encrypt and store a file.
     *
     * @param UploadedFile $file The uploaded file
     * @param string $path Storage path (relative to disk root)
     * @param string|null $disk Storage disk name
     * @return array File metadata including path and encryption info
     */
    public function encryptAndStore(UploadedFile $file, string $path, ?string $disk = null): array;

    /**
     * Decrypt and retrieve a file.
     *
     * @param string $path Path to the encrypted file
     * @param string|null $disk Storage disk name
     * @return string Decrypted file contents
     */
    public function decryptAndRetrieve(string $path, ?string $disk = null): string;

    /**
     * Stream a decrypted file to output.
     *
     * @param string $path Path to the encrypted file
     * @param string|null $disk Storage disk name
     * @return resource Stream resource
     */
    public function streamDecrypted(string $path, ?string $disk = null);

    /**
     * Delete an encrypted file.
     *
     * @param string $path Path to the encrypted file
     * @param string|null $disk Storage disk name
     * @return bool
     */
    public function delete(string $path, ?string $disk = null): bool;

    /**
     * Check if file exists.
     *
     * @param string $path Path to check
     * @param string|null $disk Storage disk name
     * @return bool
     */
    public function exists(string $path, ?string $disk = null): bool;

    /**
     * Get file metadata.
     *
     * @param string $path Path to the file
     * @param string|null $disk Storage disk name
     * @return array|null
     */
    public function getMetadata(string $path, ?string $disk = null): ?array;

    /**
     * Re-encrypt a file with a new key.
     *
     * @param string $path Path to the file
     * @param string|null $disk Storage disk name
     * @return bool
     */
    public function reEncrypt(string $path, ?string $disk = null): bool;
}
