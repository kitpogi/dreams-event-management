<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Mail;

echo "Testing email configuration...\n";
echo "Sending to: dreamsproduction63@gmail.com\n\n";

try {
    Mail::raw('Test email from D\'Dreams Event & Styles - Configuration Test', function ($message) {
        $message->to('dreamsproduction63@gmail.com')
            ->subject('Test Email - D\'Dreams Event & Styles');
    });
    echo "✅ Email sent successfully!\n";
    echo "Check your inbox at dreamsproduction63@gmail.com\n";
} catch (\Exception $e) {
    echo "❌ Error sending email:\n";
    echo "   " . $e->getMessage() . "\n";
    echo "\nFull error details:\n";
    echo $e->getTraceAsString() . "\n";
}

