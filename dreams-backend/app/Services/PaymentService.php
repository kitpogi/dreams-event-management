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

    public function __construct()
    {
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
                                'return_url' => config('app.frontend_url') . '/payment/confirm/' . $paymentId,
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
     * Verify webhook signature.
     */
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
                $payment->status = 'paid';
                $payment->paid_at = now();
                $payment->transaction_id = $attributes['payment_method']['id'] ?? $attributes['payment_method_id'] ?? null;
                $payment->payment_method = $this->extractPaymentMethod($attributes);
                $payment->save();

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
    protected function extractPaymentMethod(array $attributes): ?string
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
    protected function updateBookingPaymentStatus(BookingDetail $booking): void
    {
        $totalPaid = Payment::where('booking_id', $booking->booking_id)
            ->where('status', 'paid')
            ->sum('amount');

        $totalAmount = $booking->total_amount ?? 0;
        $depositAmount = $booking->deposit_amount ?? ($totalAmount * 0.30);

        if ($totalPaid >= $totalAmount) {
            $booking->payment_status = 'paid';
        } elseif ($totalPaid > 0) {
            $booking->payment_status = 'partial';
        } else {
            $booking->payment_status = 'unpaid';
        }

        // Automatically Approve booking if deposit is met and it's still Pending
        if ($booking->booking_status === 'Pending' && $totalPaid >= $depositAmount) {
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
}

