<?php

namespace App\Services\Contracts;

/**
 * Contract for Encryption Service operations.
 */
interface EncryptionServiceInterface
{
    /**
     * Encrypt a value.
     *
     * @param string|null $value
     * @return string|null
     */
    public function encrypt(?string $value): ?string;

    /**
     * Decrypt a value.
     *
     * @param string|null $value
     * @return string|null
     */
    public function decrypt(?string $value): ?string;

    /**
     * Encrypt multiple fields from an array.
     *
     * @param array $data
     * @param array $fieldsToEncrypt
     * @return array
     */
    public function encryptFields(array $data, array $fieldsToEncrypt): array;

    /**
     * Decrypt multiple fields from an array.
     *
     * @param array $data
     * @param array $fieldsToDecrypt
     * @return array
     */
    public function decryptFields(array $data, array $fieldsToDecrypt): array;

    /**
     * Check if a string is encrypted.
     *
     * @param string $value
     * @return bool
     */
    public function isEncrypted(string $value): bool;

    /**
     * Safely encrypt if not already encrypted.
     *
     * @param string|null $value
     * @return string|null
     */
    public function encryptIfNotEncrypted(?string $value): ?string;

    /**
     * Safely decrypt if encrypted.
     *
     * @param string|null $value
     * @return string|null
     */
    public function decryptIfEncrypted(?string $value): ?string;

    /**
     * Hash a value for indexing/searching (one-way).
     *
     * @param string $value
     * @return string
     */
    public function hashForSearch(string $value): string;
}
