<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Models\User;

class SmsNotificationService
{
    protected string $driver;
    protected bool $enabled;
    protected array $config;

    // Provider constants
    public const DRIVER_TWILIO = 'twilio';
    public const DRIVER_NEXMO = 'nexmo';
    public const DRIVER_SEMAPHORE = 'semaphore';
    public const DRIVER_LOG = 'log';

    public function __construct()
    {
        $this->driver = config('services.sms.driver', 'log');
        $this->enabled = config('services.sms.enabled', false);
        $this->config = config('services.sms', []);
    }

    /**
     * Check if SMS notifications are enabled.
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Get the current driver.
     */
    public function getDriver(): string
    {
        return $this->driver;
    }

    /**
     * Send an SMS to a phone number.
     */
    public function send(string $to, string $message): array
    {
        if (!$this->enabled) {
            return $this->result(false, 'SMS notifications are disabled');
        }

        // Validate phone number format
        $to = $this->normalizePhoneNumber($to);
        if (!$this->isValidPhoneNumber($to)) {
            return $this->result(false, 'Invalid phone number format');
        }

        // Validate message length
        if (strlen($message) > 1600) {
            return $this->result(false, 'Message too long (max 1600 characters)');
        }

        try {
            $result = match ($this->driver) {
                self::DRIVER_TWILIO => $this->sendViaTwilio($to, $message),
                self::DRIVER_NEXMO => $this->sendViaNexmo($to, $message),
                self::DRIVER_SEMAPHORE => $this->sendViaSemaphore($to, $message),
                self::DRIVER_LOG => $this->sendViaLog($to, $message),
                default => $this->result(false, 'Unknown SMS driver: ' . $this->driver),
            };

            // Record statistics
            $this->recordStatistics($result['success']);

            return $result;

        } catch (\Exception $e) {
            Log::error('SMS send error', [
                'driver' => $this->driver,
                'to' => $this->maskPhoneNumber($to),
                'error' => $e->getMessage(),
            ]);

            return $this->result(false, 'SMS send error: ' . $e->getMessage());
        }
    }

    /**
     * Send SMS to a user.
     */
    public function sendToUser(User|int $user, string $message): array
    {
        if ($user instanceof User) {
            $phone = $user->phone;
            $userId = $user->id;
        } else {
            $foundUser = User::find($user);
            if (!$foundUser) {
                return $this->result(false, 'User not found');
            }
            $phone = $foundUser->phone;
            $userId = $user;
        }

        if (empty($phone)) {
            return $this->result(false, 'User has no phone number');
        }

        $result = $this->send($phone, $message);
        $result['user_id'] = $userId;

        return $result;
    }

    /**
     * Send SMS to multiple phone numbers.
     */
    public function sendBulk(array $recipients, string $message): array
    {
        if (!$this->enabled) {
            return $this->result(false, 'SMS notifications are disabled');
        }

        $results = [
            'success' => true,
            'total' => count($recipients),
            'sent' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        foreach ($recipients as $to) {
            $result = $this->send($to, $message);
            
            if ($result['success']) {
                $results['sent']++;
            } else {
                $results['failed']++;
                $results['errors'][] = [
                    'to' => $this->maskPhoneNumber($to),
                    'error' => $result['message'],
                ];
            }
        }

        $results['success'] = $results['failed'] === 0;
        $results['message'] = "Sent {$results['sent']}/{$results['total']} messages";

        return $results;
    }

    /**
     * Send OTP (One-Time Password) SMS.
     */
    public function sendOtp(string $to, string $otp, int $expiryMinutes = 5): array
    {
        $message = "Your verification code is: {$otp}. Valid for {$expiryMinutes} minutes. Do not share this code.";
        
        return $this->send($to, $message);
    }

    /**
     * Send booking confirmation SMS.
     */
    public function sendBookingConfirmation(string $to, array $bookingDetails): array
    {
        $message = sprintf(
            "Booking Confirmed! Event: %s on %s. Reference: %s. Contact us for any changes.",
            $bookingDetails['event_type'] ?? 'Event',
            $bookingDetails['event_date'] ?? 'TBD',
            $bookingDetails['reference'] ?? 'N/A'
        );

        return $this->send($to, $message);
    }

    /**
     * Send booking reminder SMS.
     */
    public function sendBookingReminder(string $to, array $bookingDetails): array
    {
        $message = sprintf(
            "Reminder: Your %s is scheduled for %s. Reference: %s",
            $bookingDetails['event_type'] ?? 'event',
            $bookingDetails['event_date'] ?? 'soon',
            $bookingDetails['reference'] ?? 'N/A'
        );

        return $this->send($to, $message);
    }

    /**
     * Send via Twilio.
     */
    protected function sendViaTwilio(string $to, string $message): array
    {
        $accountSid = $this->config['twilio']['account_sid'] ?? null;
        $authToken = $this->config['twilio']['auth_token'] ?? null;
        $from = $this->config['twilio']['from'] ?? null;

        if (!$accountSid || !$authToken || !$from) {
            return $this->result(false, 'Twilio configuration incomplete');
        }

        $response = Http::withBasicAuth($accountSid, $authToken)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json", [
                'To' => $to,
                'From' => $from,
                'Body' => $message,
            ]);

        if ($response->successful()) {
            $data = $response->json();
            return $this->result(true, 'SMS sent via Twilio', [
                'message_id' => $data['sid'] ?? null,
                'status' => $data['status'] ?? 'queued',
            ]);
        }

        $error = $response->json();
        return $this->result(false, $error['message'] ?? 'Twilio API error');
    }

    /**
     * Send via Nexmo/Vonage.
     */
    protected function sendViaNexmo(string $to, string $message): array
    {
        $apiKey = $this->config['nexmo']['api_key'] ?? null;
        $apiSecret = $this->config['nexmo']['api_secret'] ?? null;
        $from = $this->config['nexmo']['from'] ?? 'Dreams';

        if (!$apiKey || !$apiSecret) {
            return $this->result(false, 'Nexmo configuration incomplete');
        }

        $response = Http::post('https://rest.nexmo.com/sms/json', [
            'api_key' => $apiKey,
            'api_secret' => $apiSecret,
            'to' => $to,
            'from' => $from,
            'text' => $message,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $messageData = $data['messages'][0] ?? [];

            if (($messageData['status'] ?? '1') === '0') {
                return $this->result(true, 'SMS sent via Nexmo', [
                    'message_id' => $messageData['message-id'] ?? null,
                    'remaining_balance' => $messageData['remaining-balance'] ?? null,
                ]);
            }

            return $this->result(false, $messageData['error-text'] ?? 'Nexmo send failed');
        }

        return $this->result(false, 'Nexmo API error');
    }

    /**
     * Send via Semaphore (Philippines).
     */
    protected function sendViaSemaphore(string $to, string $message): array
    {
        $apiKey = $this->config['semaphore']['api_key'] ?? null;
        $senderName = $this->config['semaphore']['sender_name'] ?? 'DREAMS';

        if (!$apiKey) {
            return $this->result(false, 'Semaphore configuration incomplete');
        }

        $response = Http::post('https://api.semaphore.co/api/v4/messages', [
            'apikey' => $apiKey,
            'number' => $to,
            'message' => $message,
            'sendername' => $senderName,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            
            if (isset($data[0]['message_id'])) {
                return $this->result(true, 'SMS sent via Semaphore', [
                    'message_id' => $data[0]['message_id'],
                ]);
            }

            return $this->result(false, $data['message'] ?? 'Semaphore send failed');
        }

        return $this->result(false, 'Semaphore API error');
    }

    /**
     * Send via log (for development/testing).
     */
    protected function sendViaLog(string $to, string $message): array
    {
        Log::info('SMS Notification (log driver)', [
            'to' => $to,
            'message' => $message,
            'timestamp' => now()->toIso8601String(),
        ]);

        return $this->result(true, 'SMS logged (development mode)', [
            'message_id' => 'log_' . uniqid(),
            'driver' => 'log',
        ]);
    }

    /**
     * Normalize phone number format.
     */
    protected function normalizePhoneNumber(string $phone): string
    {
        // Remove all non-digit characters except +
        $phone = preg_replace('/[^\d+]/', '', $phone);

        // Handle Philippine numbers
        if (preg_match('/^0(9\d{9})$/', $phone, $matches)) {
            return '+63' . $matches[1];
        }

        // Add + if missing and starts with country code
        if (!str_starts_with($phone, '+') && strlen($phone) >= 11) {
            $phone = '+' . $phone;
        }

        return $phone;
    }

    /**
     * Validate phone number format.
     */
    protected function isValidPhoneNumber(string $phone): bool
    {
        // E.164 format: +[country code][number]
        return preg_match('/^\+[1-9]\d{6,14}$/', $phone) === 1;
    }

    /**
     * Mask phone number for logging.
     */
    public function maskPhoneNumber(string $phone): string
    {
        $length = strlen($phone);
        if ($length <= 6) {
            return str_repeat('*', $length);
        }

        return substr($phone, 0, 4) . str_repeat('*', $length - 6) . substr($phone, -2);
    }

    /**
     * Record SMS statistics.
     */
    protected function recordStatistics(bool $success): void
    {
        $key = 'sms_stats:global';
        $stats = Cache::get($key, [
            'total_sent' => 0,
            'total_success' => 0,
            'total_failed' => 0,
            'last_sent_at' => null,
        ]);

        $stats['total_sent']++;
        
        if ($success) {
            $stats['total_success']++;
        } else {
            $stats['total_failed']++;
        }

        $stats['last_sent_at'] = now()->toIso8601String();

        Cache::put($key, $stats, now()->addDays(30));
    }

    /**
     * Get SMS statistics.
     */
    public function getStatistics(): array
    {
        return Cache::get('sms_stats:global', [
            'total_sent' => 0,
            'total_success' => 0,
            'total_failed' => 0,
            'last_sent_at' => null,
        ]);
    }

    /**
     * Check account balance (if supported by driver).
     */
    public function getBalance(): array
    {
        if (!$this->enabled) {
            return $this->result(false, 'SMS notifications are disabled');
        }

        try {
            return match ($this->driver) {
                self::DRIVER_TWILIO => $this->getTwilioBalance(),
                self::DRIVER_NEXMO => $this->getNexmoBalance(),
                self::DRIVER_SEMAPHORE => $this->getSemaphoreBalance(),
                default => $this->result(false, 'Balance check not supported for driver: ' . $this->driver),
            };
        } catch (\Exception $e) {
            return $this->result(false, 'Failed to check balance: ' . $e->getMessage());
        }
    }

    /**
     * Get Twilio account balance.
     */
    protected function getTwilioBalance(): array
    {
        $accountSid = $this->config['twilio']['account_sid'] ?? null;
        $authToken = $this->config['twilio']['auth_token'] ?? null;

        if (!$accountSid || !$authToken) {
            return $this->result(false, 'Twilio configuration incomplete');
        }

        $response = Http::withBasicAuth($accountSid, $authToken)
            ->get("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Balance.json");

        if ($response->successful()) {
            $data = $response->json();
            return $this->result(true, 'Balance retrieved', [
                'balance' => $data['balance'] ?? 0,
                'currency' => $data['currency'] ?? 'USD',
            ]);
        }

        return $this->result(false, 'Failed to retrieve Twilio balance');
    }

    /**
     * Get Nexmo account balance.
     */
    protected function getNexmoBalance(): array
    {
        $apiKey = $this->config['nexmo']['api_key'] ?? null;
        $apiSecret = $this->config['nexmo']['api_secret'] ?? null;

        if (!$apiKey || !$apiSecret) {
            return $this->result(false, 'Nexmo configuration incomplete');
        }

        $response = Http::get('https://rest.nexmo.com/account/get-balance', [
            'api_key' => $apiKey,
            'api_secret' => $apiSecret,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            return $this->result(true, 'Balance retrieved', [
                'balance' => $data['value'] ?? 0,
                'currency' => 'EUR',
            ]);
        }

        return $this->result(false, 'Failed to retrieve Nexmo balance');
    }

    /**
     * Get Semaphore account balance.
     */
    protected function getSemaphoreBalance(): array
    {
        $apiKey = $this->config['semaphore']['api_key'] ?? null;

        if (!$apiKey) {
            return $this->result(false, 'Semaphore configuration incomplete');
        }

        $response = Http::get('https://api.semaphore.co/api/v4/account', [
            'apikey' => $apiKey,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            return $this->result(true, 'Balance retrieved', [
                'balance' => $data['credit_balance'] ?? 0,
                'currency' => 'PHP',
            ]);
        }

        return $this->result(false, 'Failed to retrieve Semaphore balance');
    }

    /**
     * Build a result array.
     */
    protected function result(bool $success, string $message, array $data = []): array
    {
        return array_merge([
            'success' => $success,
            'message' => $message,
            'driver' => $this->driver,
        ], $data);
    }
}
