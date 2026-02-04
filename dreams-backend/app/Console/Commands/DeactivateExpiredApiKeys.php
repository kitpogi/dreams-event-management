<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ApiKeyService;

class DeactivateExpiredApiKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api-keys:deactivate-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deactivate API keys that have expired';

    /**
     * Execute the console command.
     */
    public function handle(ApiKeyService $apiKeyService): int
    {
        $this->info('Checking for expired API keys...');

        $count = $apiKeyService->deactivateExpiredKeys();

        if ($count > 0) {
            $this->info("Deactivated {$count} expired API key(s).");
        } else {
            $this->info('No expired API keys found.');
        }

        return self::SUCCESS;
    }
}
