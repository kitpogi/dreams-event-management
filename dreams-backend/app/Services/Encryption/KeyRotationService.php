<?php

namespace App\Services\Encryption;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;
use Illuminate\Contracts\Encryption\DecryptException;
use App\Models\User;
use App\Models\Venue;

/**
 * Service for rotating encryption keys.
 * 
 * This service handles the process of re-encrypting all encrypted data
 * when the application key needs to be rotated for security reasons.
 * 
 * Key rotation process:
 * 1. Set the old key in config('app.previous_key')
 * 2. Generate a new key and set it as config('app.key')
 * 3. Run the key rotation command to re-encrypt all data
 */
class KeyRotationService
{
    protected FieldEncryptionService $encryptionService;
    
    /**
     * Models with encrypted fields and their encrypted field names.
     */
    protected array $encryptedModels = [
        User::class => [
            'fields' => ['phone'],
            'primaryKey' => 'id',
        ],
        Venue::class => [
            'fields' => ['location'],
            'primaryKey' => 'id',
        ],
    ];

    /**
     * Statistics for the rotation process.
     */
    protected array $stats = [
        'total_records' => 0,
        'successful' => 0,
        'failed' => 0,
        'skipped' => 0,
    ];

    public function __construct(FieldEncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    /**
     * Rotate encryption keys for all encrypted data.
     *
     * @param string $oldKey The previous encryption key
     * @param string|null $newKey The new encryption key (uses current app.key if null)
     * @param bool $dryRun If true, don't actually save changes
     * @return array Statistics about the rotation
     */
    public function rotateKeys(string $oldKey, ?string $newKey = null, bool $dryRun = false): array
    {
        $newKey = $newKey ?? config('app.key');
        
        Log::info('Starting encryption key rotation', [
            'dry_run' => $dryRun,
            'models' => array_keys($this->encryptedModels),
        ]);

        $this->resetStats();

        foreach ($this->encryptedModels as $modelClass => $config) {
            $this->rotateModelKeys($modelClass, $config, $oldKey, $newKey, $dryRun);
        }

        Log::info('Encryption key rotation completed', $this->stats);

        return $this->stats;
    }

    /**
     * Rotate keys for a specific model.
     *
     * @param string $modelClass
     * @param array $config
     * @param string $oldKey
     * @param string $newKey
     * @param bool $dryRun
     */
    protected function rotateModelKeys(
        string $modelClass, 
        array $config, 
        string $oldKey, 
        string $newKey,
        bool $dryRun
    ): void {
        $fields = $config['fields'];
        $primaryKey = $config['primaryKey'];

        Log::info("Rotating keys for {$modelClass}", ['fields' => $fields]);

        // Process in chunks to avoid memory issues
        $modelClass::query()->chunk(100, function ($records) use ($fields, $primaryKey, $oldKey, $newKey, $dryRun, $modelClass) {
            foreach ($records as $record) {
                $this->stats['total_records']++;
                
                try {
                    $updates = $this->rotateRecordFields($record, $fields, $oldKey, $newKey);
                    
                    if (empty($updates)) {
                        $this->stats['skipped']++;
                        continue;
                    }

                    if (!$dryRun) {
                        DB::table($record->getTable())
                            ->where($primaryKey, $record->$primaryKey)
                            ->update($updates);
                    }

                    $this->stats['successful']++;
                } catch (\Exception $e) {
                    $this->stats['failed']++;
                    Log::error("Failed to rotate keys for {$modelClass}", [
                        'id' => $record->$primaryKey,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });
    }

    /**
     * Rotate encrypted fields for a single record.
     *
     * @param mixed $record
     * @param array $fields
     * @param string $oldKey
     * @param string $newKey
     * @return array Updated field values
     */
    protected function rotateRecordFields($record, array $fields, string $oldKey, string $newKey): array
    {
        $updates = [];

        foreach ($fields as $field) {
            $encryptedValue = $record->getRawOriginal($field);
            
            if ($encryptedValue === null) {
                continue;
            }

            try {
                // Decrypt with old key
                $decrypted = $this->decryptWithKey($encryptedValue, $oldKey);
                
                if ($decrypted === null) {
                    continue;
                }

                // Re-encrypt with new key
                $reEncrypted = $this->encryptWithKey($decrypted, $newKey);
                
                $updates[$field] = $reEncrypted;
            } catch (DecryptException $e) {
                // Value might already be encrypted with new key or not encrypted at all
                Log::debug("Skipping field {$field} - may already be rotated or unencrypted");
            }
        }

        return $updates;
    }

    /**
     * Decrypt a value with a specific key.
     *
     * @param string $value
     * @param string $key
     * @return string|null
     */
    protected function decryptWithKey(string $value, string $key): ?string
    {
        // Temporarily swap the encryption key
        $originalKey = config('app.key');
        Config::set('app.key', $key);
        
        try {
            $decrypted = Crypt::decryptString($value);
            return $decrypted;
        } finally {
            // Restore original key
            Config::set('app.key', $originalKey);
        }
    }

    /**
     * Encrypt a value with a specific key.
     *
     * @param string $value
     * @param string $key
     * @return string
     */
    protected function encryptWithKey(string $value, string $key): string
    {
        // Temporarily swap the encryption key
        $originalKey = config('app.key');
        Config::set('app.key', $key);
        
        try {
            $encrypted = Crypt::encryptString($value);
            return $encrypted;
        } finally {
            // Restore original key
            Config::set('app.key', $originalKey);
        }
    }

    /**
     * Verify that all encrypted data can be decrypted with the current key.
     *
     * @return array Verification results
     */
    public function verifyEncryption(): array
    {
        $results = [
            'total' => 0,
            'valid' => 0,
            'invalid' => 0,
            'null' => 0,
            'errors' => [],
        ];

        foreach ($this->encryptedModels as $modelClass => $config) {
            $fields = $config['fields'];
            $primaryKey = $config['primaryKey'];

            $modelClass::query()->chunk(100, function ($records) use ($fields, $primaryKey, $modelClass, &$results) {
                foreach ($records as $record) {
                    foreach ($fields as $field) {
                        $results['total']++;
                        $encryptedValue = $record->getRawOriginal($field);
                        
                        if ($encryptedValue === null) {
                            $results['null']++;
                            continue;
                        }

                        try {
                            Crypt::decryptString($encryptedValue);
                            $results['valid']++;
                        } catch (DecryptException $e) {
                            $results['invalid']++;
                            $results['errors'][] = [
                                'model' => $modelClass,
                                'id' => $record->$primaryKey,
                                'field' => $field,
                                'error' => $e->getMessage(),
                            ];
                        }
                    }
                }
            });
        }

        return $results;
    }

    /**
     * Get the list of models with encrypted fields.
     *
     * @return array
     */
    public function getEncryptedModels(): array
    {
        return $this->encryptedModels;
    }

    /**
     * Register additional models with encrypted fields.
     *
     * @param string $modelClass
     * @param array $fields
     * @param string $primaryKey
     */
    public function registerEncryptedModel(string $modelClass, array $fields, string $primaryKey = 'id'): void
    {
        $this->encryptedModels[$modelClass] = [
            'fields' => $fields,
            'primaryKey' => $primaryKey,
        ];
    }

    /**
     * Reset statistics.
     */
    protected function resetStats(): void
    {
        $this->stats = [
            'total_records' => 0,
            'successful' => 0,
            'failed' => 0,
            'skipped' => 0,
        ];
    }

    /**
     * Get current statistics.
     *
     * @return array
     */
    public function getStats(): array
    {
        return $this->stats;
    }
}
