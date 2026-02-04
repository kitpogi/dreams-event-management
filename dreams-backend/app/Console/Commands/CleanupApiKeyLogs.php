<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ApiKeyService;

class CleanupApiKeyLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api-keys:cleanup-logs {--days=90 : Number of days to keep logs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up old API key usage logs';

    /**
     * Execute the console command.
     */
    public function handle(ApiKeyService $apiKeyService): int
    {
        $days = (int) $this->option('days');
        
        $this->info("Cleaning up API key logs older than {$days} days...");

        $deleted = $apiKeyService->cleanupOldLogs($days);

        $this->info("Deleted {$deleted} old log entries.");

        return Command::SUCCESS;
    }
}
