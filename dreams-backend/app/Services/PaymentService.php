<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\BookingDetail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Exception;

class PaymentService
{
    protected $secretKey;
    protected $publicKey;
    protected $baseUrl;
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
        $this->secretKey = config('services.paymongo.secret_key');
        $this->publicKey = config('services.paymongo.public_key');
        $this->baseUrl = config('services.paymongo.base_url', 'https://api.paymongo.com/v1');
    }

    /**
     * Create a payment intent for a booking.
     */
    public function createPaymentIntent(BookingDetail $booking, float $amount, string $currency = 'PHP', array $paymentMethods = ['card', 'gcash', 'maya']): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode($this->secretKey . ':'),
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/payment_intents', [
                        'data' => [
                            'attributes' => [
                                'amount' => (int) ($amount * 100), // Convert to centavos
                                'currency' => $currency,
                                'payment_method_allowed' => $paymentMethods,
                                'metadata' => [
                                    'booking_id' => (string) $booking->booking_id,
                                    'client_id' => (string) $booking->client_id,
                                    'package_id' => (string) $booking->package_id,
                                ],
                            ],
                        ],
                    ]);

            if ($response->successful()) {
                $data = $response->json();
                $paymentIntent = $data['data'];

                return [
                    'success' => true,
                    'payment_intent_id' => $paymentIntent['id'],
                    'client_key' => $paymentIntent['attributes']['client_key'],
                    'amount' => $paymentIntent['attributes']['amount'] / 100,
                    'currency' => $paymentIntent['attributes']['currency'],
                ];
            }

            $errorBody = $response->body();
            Log::error('PayMongo Payment Intent Creation Failed: ' . $errorBody);
            throw new Exception('Failed to create payment intent: ' . $errorBody);
        } catch (Exception $e) {
            Log::error('Payment intent creation failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Attach payment method to payment intent.
     */
    public function attachPaymentMethod(string $paymentIntentId, string $paymentMethodId, int $paymentId): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode($this->secretKey . ':'),
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/payment_intents/' . $paymentIntentId . '/attach', [
                        'data' => [
                            'attributes' => [
                                'payment_method' => $paymentMethodId,
                                'return_url' => env('FRONTEND_URL', 'http://localhost:3000') . '/payment/confirm/' . $paymentId,
                            ],
                        ],
                    ]);

            if ($response->successful()) {
                $data = $response->json();
                $paymentIntent = $data['data'];

                return [
                    'success' => true,
                    'payment_intent' => $paymentIntent,
                    'status' => $paymentIntent['attributes']['status'],
                ];
            }

            throw new Exception('Failed to attach payment method: ' . $response->body());
        } catch (Exception $e) {
            Log::error('Payment method attachment failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Create a payment method server-side (for e-wallets like GCash, Maya, DOB).
     */
    public function createPaymentMethod(string $type, array $billing = []): array
    {
        try {
            $attributes = ['type' => $type];

            if (!empty($billing)) {
                $attributes['billing'] = $billing;
            }

            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode($this->secretKey . ':'),
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/payment_methods', [
                        'data' => [
                            'attributes' => $attributes,
                        ],
                    ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'payment_method_id' => $data['data']['id'],
                    'type' => $data['data']['attributes']['type'],
                ];
            }

            throw new Exception('Failed to create payment method: ' . $response->body());
        } catch (Exception $e) {
            Log::error('Payment method creation failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Retrieve payment intent status.
     */
    public function getPaymentIntent(string $paymentIntentId): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode($this->secretKey . ':'),
            ])->get($this->baseUrl . '/payment_intents/' . $paymentIntentId);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'payment_intent' => $data['data'],
                ];
            }

            throw new Exception('Failed to retrieve payment intent: ' . $response->body());
        } catch (Exception $e) {
            Log::error('Payment intent retrieval failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Sync payment status with PayMongo.
     */
    public function syncPaymentStatus(Payment $payment): bool
    {
        if (empty($payment->payment_intent_id)) {
            return false;
        }

        $result = $this->getPaymentIntent($payment->payment_intent_id);
        if (!$result['success']) {
            return false;
        }

        $paymentIntent = $result['payment_intent'];
        $status = $paymentIntent['attributes']['status'];
        $hasChanged = false;

        if ($status === 'succeeded') {
            if ($payment->status !== 'paid') {
                $payment->status = 'paid';
                $payment->paid_at = now();
                $hasChanged = true;

                // Notify admins of new payment
                $this->notifyAdminsOfPayment($payment);
            }

            // Always ensure booking status is synced if payment is succeeded
            if ($payment->booking) {
                // Persist payment status if changed so sum() is correct in updateBookingPaymentStatus
                if ($hasChanged) {
                    $payment->save();
                    $hasChanged = false;
                }
                $this->updateBookingPaymentStatus($payment->booking);
            }
        } elseif (($status === 'awaiting_payment_method' || $status === 'processing') && $payment->status !== 'pending') {
            // Note: In our system 'pending' covers both awaiting_payment_method and backend-processing for simplicity of UI
            $payment->status = 'pending';
            $hasChanged = true;
        }

        // Always try to extract payment method if current one is unknown
        if (empty($payment->payment_method) || $payment->payment_method === 'Unknown') {
            $extractedMethod = $this->extractPaymentMethod($paymentIntent['attributes']);
            if ($extractedMethod) {
                $payment->payment_method = $extractedMethod;
                $hasChanged = true;
            }
        }

        if ($hasChanged) {
            $payment->save();
        }

        return $hasChanged;
    }

    /**
     * Verify webhook signature.
     */
    public function verifyWebhookSignature(string $payload, string $signature, string $secret): bool
    {
        if (empty($signature) || empty($secret)) {
            return false;
        }

        // PayMongo signatures are in the format: t=<timestamp>,v1=<signature>
        // We need to parse this or at least try to match the v1 portion
        $parts = explode(',', $signature);
        $v1 = null;
        $timestamp = null;

        foreach ($parts as $part) {
            if (str_starts_with(trim($part), 't=')) {
                $timestamp = substr(trim($part), 2);
            } elseif (str_starts_with(trim($part), 'v1=')) {
                $v1 = substr(trim($part), 3);
            }
        }

        if (!$v1 || !$timestamp) {
            // Fallback for simple signatures if any
            $computedSignature = hash_hmac('sha256', $payload, $secret);
            return hash_equals($computedSignature, $signature);
        }

        // Standard PayMongo verification: hash(timestamp . "." . payload)
        $signedPayload = $timestamp . '.' . $payload;
        $computedSignature = hash_hmac('sha256', $signedPayload, $secret);

        return hash_equals($computedSignature, $v1);
    }

    /**
     * Process webhook event.
     */
    public function processWebhook(array $eventData): void
    {
        $eventType = $eventData['type'] ?? null;
        $data = $eventData['data'] ?? null;

        if (!$eventType || !$data) {
            Log::warning('Invalid webhook event data');
            return;
        }

        $paymentIntentId = $data['id'] ?? null;
        $attributes = $data['attributes'] ?? [];

        if (!$paymentIntentId) {
            Log::warning('Payment intent ID not found in webhook data');
            return;
        }

        // Find payment by payment_intent_id
        $payment = Payment::where('payment_intent_id', $paymentIntentId)->first();

        if (!$payment) {
            Log::warning('Payment not found for payment intent: ' . $paymentIntentId);
            return;
        }

        // Update payment status based on event type
        switch ($eventType) {
            case 'payment_intent.succeeded':
                $isNewPayment = $payment->status !== 'paid';
                $payment->status = 'paid';
                $payment->paid_at = now();
                $payment->transaction_id = $attributes['payment_method']['id'] ?? $attributes['payment_method_id'] ?? null;
                $payment->payment_method = $this->extractPaymentMethod($attributes);
                $payment->save();

                // Notify admins of new payment
                if ($isNewPayment) {
                    $this->notifyAdminsOfPayment($payment);
                }

                // Update booking payment status
                if ($payment->booking) {
                    $this->updateBookingPaymentStatus($payment->booking);
                }
                break;

            case 'payment_intent.payment_failed':
                $payment->status = 'failed';
                $lastError = $attributes['last_payment_error'] ?? [];
                $payment->failure_reason = $lastError['message'] ?? $lastError['detail'] ?? 'Payment failed';
                $payment->save();
                break;

            case 'payment_intent.cancelled':
                $payment->status = 'cancelled';
                $payment->save();
                break;

            case 'payment_intent.awaiting_payment_method':
                $payment->status = 'pending';
                $payment->save();
                break;
        }
    }

    /**
     * Extract payment method from payment intent attributes.
     */
    public function extractPaymentMethod(array $attributes): ?string
    {
        $paymentMethod = $attributes['payment_method'] ?? null;

        if (is_array($paymentMethod)) {
            $type = $paymentMethod['type'] ?? null;
            if ($type) {
                return match ($type) {
                    'card' => 'card',
                    'gcash' => 'gcash',
                    'paymaya' => 'maya',
                    'qr_ph' => 'qr_ph',
                    'bank_transfer' => 'bank_transfer',
                    default => $type,
                };
            }
        }

        return null;
    }

    /**
     * Update booking payment status based on payments.
     */
    public function updateBookingPaymentStatus(BookingDetail $booking): void
    {
        $totalPaid = Payment::where('booking_id', $booking->booking_id)
            ->where('status', 'paid')
            ->sum('amount');

        $totalAmount = $booking->total_amount ?? 0;
        $depositAmount = $booking->deposit_amount ?? ($totalAmount * 0.30);

        if ($totalPaid >= (float) $totalAmount - 0.01) {
            $booking->payment_status = 'paid';
        } elseif ($totalPaid > 0.01) {
            $booking->payment_status = 'partial';
        } else {
            $booking->payment_status = 'unpaid';
        }

        // Automatically Approve booking if deposit is met and it's still Pending
        $currentBookingStatus = strtolower($booking->booking_status ?? '');
        if ($currentBookingStatus === 'pending' && $totalPaid >= (float) $depositAmount - 0.01) {
            $booking->booking_status = 'Approved';
            Log::info("Booking #{$booking->booking_id} automatically approved due to payment.");
        }

        $booking->save();
    }

    /**
     * Create a payment link for invoice.
     */
    public function createPaymentLink(BookingDetail $booking, float $amount, ?string $description = null): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode($this->secretKey . ':'),
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/links', [
                        'data' => [
                            'attributes' => [
                                'amount' => (int) ($amount * 100),
                                'currency' => 'PHP',
                                'description' => $description ?? 'Payment for Booking #' . $booking->booking_id,
                                'metadata' => [
                                    'booking_id' => $booking->booking_id,
                                ],
                            ],
                        ],
                    ]);

            if ($response->successful()) {
                $data = $response->json();
                $link = $data['data'];

                return [
                    'success' => true,
                    'payment_link_id' => $link['id'],
                    'checkout_url' => $link['attributes']['checkout_url'],
                ];
            }

            throw new Exception('Failed to create payment link: ' . $response->body());
        } catch (Exception $e) {
            Log::error('Payment link creation failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Notify admins and coordinators of a successful payment.
     */
    protected function notifyAdminsOfPayment(Payment $payment): void
    {
        try {
            // Reload booking and client to ensure we have data
            $payment->load(['booking.client']);
            $booking = $payment->booking;

            $clientName = $booking && $booking->client
                ? $booking->client->client_fname . ' ' . $booking->client->client_lname
                : 'A client';

            $amount = number_format((float) $payment->amount, 2);
            $bookingId = $booking ? $booking->booking_id : 'N/A';

            $title = "💰 Payment Received: ₱{$amount}";
            $message = "{$clientName} has paid ₱{$amount} for Booking #{$bookingId}.";

            // Notify both admins and coordinators
            $this->notificationService->sendToRole(
                'admin',
                NotificationService::TYPE_PAYMENT,
                $title,
                $message,
                ['payment_id' => $payment->id, 'booking_id' => $bookingId],
                NotificationService::PRIORITY_HIGH,
                "/admin/bookings/{$bookingId}"
            );

            $this->notificationService->sendToRole(
                'coordinator',
                NotificationService::TYPE_PAYMENT,
                $title,
                $message,
                ['payment_id' => $payment->id, 'booking_id' => $bookingId],
                NotificationService::PRIORITY_HIGH,
                "/admin/bookings/{$bookingId}"
            );

            Log::info("Admin and Coordinator notified of payment for Booking #{$bookingId}");
        } catch (Exception $e) {
            Log::error("Failed to send payment notification: " . $e->getMessage());
        }
    }
}

