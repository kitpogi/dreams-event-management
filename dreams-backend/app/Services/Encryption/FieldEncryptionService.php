<?php

namespace App\Services\Encryption;

use App\Services\Contracts\EncryptionServiceInterface;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\Encryption\DecryptException;

/**
 * Service for encrypting and decrypting sensitive fields at the application level
 * Provides field-level encryption for PII and other sensitive data
 */
class FieldEncryptionService implements EncryptionServiceInterface
{
    /**
     * Encrypt a value
     */
    public function encrypt(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        try {
            return Crypt::encryptString($value);
        } catch (\Exception $e) {
            Log::error('Field encryption failed', [
                'error' => $e->getMessage(),
                'value_length' => strlen($value),
            ]);
            throw $e;
        }
    }

    /**
     * Decrypt a value
     */
    public function decrypt(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (DecryptException $e) {
            Log::error('Field decryption failed', [
                'error' => $e->getMessage(),
                'encrypted_length' => strlen($value),
            ]);
            throw $e;
        }
    }

    /**
     * Encrypt multiple fields from an array
     *
     * @param array $data
     * @param array $fieldsToEncrypt
     * @return array
     */
    public function encryptFields(array $data, array $fieldsToEncrypt): array
    {
        foreach ($fieldsToEncrypt as $field) {
            if (isset($data[$field])) {
                $data[$field] = $this->encrypt($data[$field]);
            }
        }

        return $data;
    }

    /**
     * Decrypt multiple fields from an array
     *
     * @param array $data
     * @param array $fieldsToDecrypt
     * @return array
     */
    public function decryptFields(array $data, array $fieldsToDecrypt): array
    {
        foreach ($fieldsToDecrypt as $field) {
            if (isset($data[$field])) {
                $data[$field] = $this->decrypt($data[$field]);
            }
        }

        return $data;
    }

    /**
     * Check if a string is encrypted
     * Encrypted strings typically start with "eyJ" or similar base64 pattern
     */
    public function isEncrypted(string $value): bool
    {
        try {
            // Try to decrypt; if it succeeds, it's encrypted
            Crypt::decryptString($value);
            return true;
        } catch (DecryptException $e) {
            return false;
        }
    }

    /**
     * Safely encrypt if not already encrypted
     */
    public function encryptIfNotEncrypted(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($this->isEncrypted($value)) {
            return $value;
        }

        return $this->encrypt($value);
    }

    /**
     * Safely decrypt if encrypted
     */
    public function decryptIfEncrypted(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (!$this->isEncrypted($value)) {
            return $value;
        }

        return $this->decrypt($value);
    }

    /**
     * Hash a value for indexing/searching (one-way)
     * Use this for fields that need to be searchable but also encrypted
     */
    public function hashForSearch(string $value): string
    {
        return hash('sha256', $value . config('app.key'));
    }

    /**
     * Create a searchable field mapping
     * Returns both encrypted value and hash for searching
     */
    public function createSearchableField(string $value): array
    {
        return [
            'encrypted' => $this->encrypt($value),
            'hash' => $this->hashForSearch($value),
        ];
    }
}
