<?php

namespace App\Console\Commands;

use App\Services\Encryption\KeyRotationService;
use Illuminate\Console\Command;

class RotateEncryptionKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'encryption:rotate 
                            {--old-key= : The previous encryption key (required)}
                            {--dry-run : Run without making actual changes}
                            {--verify : Verify all encrypted data can be decrypted}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Rotate encryption keys for all encrypted data in the database';

    protected KeyRotationService $keyRotationService;

    public function __construct(KeyRotationService $keyRotationService)
    {
        parent::__construct();
        $this->keyRotationService = $keyRotationService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('verify')) {
            return $this->verifyEncryption();
        }

        $oldKey = $this->option('old-key');
        
        if (!$oldKey) {
            $this->error('The --old-key option is required for key rotation.');
            $this->info('Usage: php artisan encryption:rotate --old-key="base64:your-old-key-here"');
            return self::FAILURE;
        }

        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->warn('Running in DRY RUN mode. No changes will be saved.');
        }

        $this->info('Starting encryption key rotation...');
        $this->newLine();

        // Show models that will be processed
        $models = $this->keyRotationService->getEncryptedModels();
        $this->info('Models with encrypted fields:');
        foreach ($models as $model => $config) {
            $this->line("  - {$model}: " . implode(', ', $config['fields']));
        }
        $this->newLine();

        if (!$dryRun && !$this->confirm('This will re-encrypt all data with the new key. Are you sure?')) {
            $this->info('Operation cancelled.');
            return self::SUCCESS;
        }

        $this->info('Processing...');
        
        $stats = $this->keyRotationService->rotateKeys($oldKey, null, $dryRun);

        $this->newLine();
        $this->info('Key rotation completed!');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Records', $stats['total_records']],
                ['Successful', $stats['successful']],
                ['Failed', $stats['failed']],
                ['Skipped (null values)', $stats['skipped']],
            ]
        );

        if ($stats['failed'] > 0) {
            $this->warn('Some records failed to rotate. Check the logs for details.');
            return self::FAILURE;
        }

        if ($dryRun) {
            $this->newLine();
            $this->info('This was a dry run. Run without --dry-run to apply changes.');
        }

        return self::SUCCESS;
    }

    /**
     * Verify all encrypted data.
     */
    protected function verifyEncryption(): int
    {
        $this->info('Verifying all encrypted data...');
        $this->newLine();

        $results = $this->keyRotationService->verifyEncryption();

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Fields', $results['total']],
                ['Valid (decryptable)', $results['valid']],
                ['Invalid (cannot decrypt)', $results['invalid']],
                ['Null Values', $results['null']],
            ]
        );

        if ($results['invalid'] > 0) {
            $this->newLine();
            $this->error('Some fields cannot be decrypted with the current key:');
            
            foreach (array_slice($results['errors'], 0, 10) as $error) {
                $this->line("  - {$error['model']} (ID: {$error['id']}), field: {$error['field']}");
            }
            
            if (count($results['errors']) > 10) {
                $this->line("  ... and " . (count($results['errors']) - 10) . " more errors");
            }

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('All encrypted data is valid and can be decrypted with the current key.');

        return self::SUCCESS;
    }
}
