<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\PasswordPolicyService;

class MarkExpiredPasswords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'passwords:mark-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark expired passwords for users who need to change their password';

    /**
     * Execute the console command.
     */
    public function handle(PasswordPolicyService $passwordPolicy): int
    {
        $this->info('Checking for expired passwords...');

        $count = $passwordPolicy->markExpiredPasswords();

        if ($count > 0) {
            $this->info("Marked {$count} user(s) with expired passwords.");
        } else {
            $this->info('No expired passwords found.');
        }

        return self::SUCCESS;
    }
}
