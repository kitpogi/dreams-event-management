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
     * Track which fields have been decrypted (to ensure re-encryption on save)
     */
    protected array $decryptedFields = [];
    
    /**
     * Cache of decrypted plaintext values
     */
    protected array $plaintextCache = [];

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
     * Override getAttribute to return plaintext for encrypted fields
     */
    public function getAttribute($key)
    {
        // If it's an encrypted field and we have a plaintext cache, return plaintext
        if (in_array($key, $this->getEncryptedFields()) && isset($this->plaintextCache[$key])) {
            return $this->plaintextCache[$key];
        }

        return parent::getAttribute($key);
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
            // Use attributes directly to avoid triggering accessors
            $value = $this->attributes[$field] ?? null;
            
            if ($value === null) {
                continue;
            }

            // Check if field was decrypted (needs re-encryption) or is dirty (needs encryption)
            $wasDecrypted = in_array($field, $this->decryptedFields);
            $isDirty = $this->isDirty($field);

            if (($isDirty || $wasDecrypted) && !$service->isEncrypted($value)) {
                // Cache the plaintext value for in-memory access
                $this->plaintextCache[$field] = $value;
                
                // Encrypt for database storage
                $this->attributes[$field] = $service->encrypt($value);
                
                // Remove from decrypted tracking since we've now encrypted it
                $this->decryptedFields = array_filter(
                    $this->decryptedFields,
                    fn($f) => $f !== $field
                );
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
                    $plaintext = $service->decrypt($this->attributes[$field]);
                    
                    // Cache the plaintext for in-memory access
                    $this->plaintextCache[$field] = $plaintext;
                    
                    // Keep encrypted in attributes for DB consistency
                    // But return plaintext when accessed via getAttribute
                    
                    // Track that this field has been decrypted (needs re-encryption on save)
                    if (!in_array($field, $this->decryptedFields)) {
                        $this->decryptedFields[] = $field;
                    }
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
     * Get encrypted value (raw) of a field from the database
     */
    public function getEncrypted(string $field): ?string
    {
        if (!in_array($field, $this->getEncryptedFields())) {
            throw new \InvalidArgumentException("Field '{$field}' is not configured for encryption");
        }

        // Use raw database query to get encrypted value without triggering decryption hooks
        $value = $this->getConnection()
            ->table($this->getTable())
            ->where($this->getKeyName(), $this->getKey())
            ->value($field);

        return $value;
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
