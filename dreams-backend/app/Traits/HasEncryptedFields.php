<?php

namespace App\Traits;

use App\Services\Encryption\FieldEncryptionService;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * Trait for adding field-level encryption to Eloquent models
 * Automatically encrypts/decrypts specified fields
 *
 * Usage in Model:
 * - Add to class: use HasEncryptedFields;
 * - Define: protected array $encrypted = ['phone', 'ssn'];
 */
trait HasEncryptedFields
{
    /**
     * Boot the trait
     */
    public static function bootHasEncryptedFields(): void
    {
        // Encrypt on save
        static::saving(function ($model) {
            $model->encryptFields();
        });

        // Decrypt on retrieve
        static::retrieved(function ($model) {
            $model->decryptFields();
        });
    }

    /**
     * Get the encryption service
     */
    protected function getEncryptionService(): FieldEncryptionService
    {
        return app(FieldEncryptionService::class);
    }

    /**
     * Get encrypted fields configuration
     */
    protected function getEncryptedFields(): array
    {
        return $this->encrypted ?? [];
    }

    /**
     * Encrypt specified fields
     */
    public function encryptFields(): void
    {
        $encryptedFields = $this->getEncryptedFields();

        if (empty($encryptedFields)) {
            return;
        }

        $service = $this->getEncryptionService();

        foreach ($encryptedFields as $field) {
            if ($this->isDirty($field) && $this->{$field} !== null) {
                // Check if already encrypted to avoid double encryption
                if (!$service->isEncrypted($this->{$field})) {
                    $this->{$field} = $service->encrypt($this->{$field});
                }
            }
        }
    }

    /**
     * Decrypt specified fields
     */
    public function decryptFields(): void
    {
        $encryptedFields = $this->getEncryptedFields();

        if (empty($encryptedFields)) {
            return;
        }

        $service = $this->getEncryptionService();

        foreach ($encryptedFields as $field) {
            if (isset($this->attributes[$field]) && $this->attributes[$field] !== null) {
                // Only decrypt if it's encrypted
                if ($service->isEncrypted($this->attributes[$field])) {
                    $this->attributes[$field] = $service->decrypt($this->attributes[$field]);
                }
            }
        }
    }

    /**
     * Get decrypted value of an encrypted field
     */
    public function getDecrypted(string $field): ?string
    {
        if (!in_array($field, $this->getEncryptedFields())) {
            throw new \InvalidArgumentException("Field '{$field}' is not configured for encryption");
        }

        $value = $this->getRawOriginal($field);

        if ($value === null) {
            return null;
        }

        $service = $this->getEncryptionService();
        return $service->isEncrypted($value) ? $service->decrypt($value) : $value;
    }

    /**
     * Get encrypted value (raw) of a field
     */
    public function getEncrypted(string $field): ?string
    {
        return $this->getRawOriginal($field);
    }

    /**
     * Set encrypted field with automatic encryption
     */
    public function setEncrypted(string $field, ?string $value): void
    {
        if (!in_array($field, $this->getEncryptedFields())) {
            throw new \InvalidArgumentException("Field '{$field}' is not configured for encryption");
        }

        $service = $this->getEncryptionService();
        $this->{$field} = $service->encryptIfNotEncrypted($value);
    }

    /**
     * Get searchable hash of encrypted field for queries
     */
    public function getSearchHash(string $field): ?string
    {
        $decrypted = $this->getDecrypted($field);

        if ($decrypted === null) {
            return null;
        }

        return $this->getEncryptionService()->hashForSearch($decrypted);
    }

    /**
     * Query by encrypted field value
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $field
     * @param string $value
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWhereEncrypted($query, string $field, string $value)
    {
        $service = $this->getEncryptionService();
        $hash = $service->hashForSearch($value);

        return $query->where("{$field}_hash", $hash);
    }

    /**
     * Get array of decrypted data for API responses
     */
    public function getDecryptedArray(): array
    {
        $data = $this->toArray();
        $encryptedFields = $this->getEncryptedFields();

        foreach ($encryptedFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = $this->getDecrypted($field);
            }
        }

        return $data;
    }
}
