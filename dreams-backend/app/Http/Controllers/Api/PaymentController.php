<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BookingDetail;
use App\Models\Payment;
use App\Services\PaymentService;
use App\Services\ClientService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    protected $paymentService;
    protected $clientService;

    public function __construct(PaymentService $paymentService, ClientService $clientService)
    {
        $this->paymentService = $paymentService;
        $this->clientService = $clientService;
    }

    /**
     * Create a payment intent for a booking.
     */
    public function createPaymentIntent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'booking_id' => 'required|exists:booking_details,booking_id',
            'amount' => 'required|numeric|min:1',
            'payment_methods' => 'sometimes|array',
            'payment_methods.*' => 'in:card,gcash,maya,qr_ph,bank_transfer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $booking = BookingDetail::with(['client', 'eventPackage'])->findOrFail($request->booking_id);

        // Verify user owns the booking or is admin
        if (!$request->user()->isAdmin()) {
            $client = $this->clientService->getByUserEmail($request->user()->email);
            if (!$client || $booking->client_id !== $client->client_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }
        }

        $amount = (float) $request->amount;
        $paymentMethods = $request->payment_methods ?? ['card', 'gcash', 'maya'];

        $result = $this->paymentService->createPaymentIntent($booking, $amount, 'PHP', $paymentMethods);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment intent',
                'error' => $result['error'] ?? 'Unknown error',
            ], 500);
        }

        // Create payment record
        $payment = Payment::create([
            'booking_id' => $booking->booking_id,
            'payment_intent_id' => $result['payment_intent_id'],
            'amount' => $result['amount'],
            'currency' => $result['currency'],
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'payment_id' => $payment->id,
                'payment_intent_id' => $result['payment_intent_id'],
                'client_key' => $result['client_key'],
                'amount' => $result['amount'],
                'currency' => $result['currency'],
            ],
        ]);
    }

    /**
     * Attach payment method to payment intent.
     */
    public function attachPaymentMethod(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_intent_id' => 'required|string',
            'payment_method_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->paymentService->attachPaymentMethod(
            $request->payment_intent_id,
            $request->payment_method_id
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to attach payment method',
                'error' => $result['error'] ?? 'Unknown error',
            ], 500);
        }

        // Update payment record
        $payment = Payment::where('payment_intent_id', $request->payment_intent_id)->first();
        if ($payment) {
            $payment->payment_method_id = $request->payment_method_id;
            $payment->status = $result['status'] === 'succeeded' ? 'paid' : 'processing';
            if ($result['status'] === 'succeeded') {
                $payment->paid_at = now();
            }
            $payment->save();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $result['status'],
                'payment_intent' => $result['payment_intent'],
            ],
        ]);
    }

    /**
     * Get payment status.
     */
    public function getPaymentStatus(Request $request, $paymentId)
    {
        $payment = Payment::with('booking')->findOrFail($paymentId);

        // Verify user owns the booking or is admin
        if (!$request->user()->isAdmin()) {
            $client = $this->clientService->getByUserEmail($request->user()->email);
            if (!$client || $payment->booking->client_id !== $client->client_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }
        }

        // Get latest status from PayMongo
        if ($payment->payment_intent_id) {
            $result = $this->paymentService->getPaymentIntent($payment->payment_intent_id);
            if ($result['success']) {
                $paymentIntent = $result['payment_intent'];
                $status = $paymentIntent['attributes']['status'];

                // Update payment status if changed
                if ($status === 'succeeded' && $payment->status !== 'paid') {
                    $payment->status = 'paid';
                    $payment->paid_at = now();
                    $payment->save();
                } elseif ($status === 'awaiting_payment_method' && $payment->status !== 'pending') {
                    $payment->status = 'pending';
                    $payment->save();
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $payment->load('booking'),
        ]);
    }

    /**
     * Get payments for a booking.
     */
    public function getBookingPayments(Request $request, $bookingId)
    {
        $booking = BookingDetail::findOrFail($bookingId);

        // Verify user owns the booking or is admin
        if (!$request->user()->isAdmin()) {
            $client = $this->clientService->getByUserEmail($request->user()->email);
            if (!$client || $booking->client_id !== $client->client_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }
        }

        $payments = Payment::where('booking_id', $bookingId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * Create payment link for invoice.
     */
    public function createPaymentLink(Request $request, $bookingId)
    {
        $booking = BookingDetail::with(['client', 'eventPackage'])->findOrFail($bookingId);

        // Verify user owns the booking or is admin
        if (!$request->user()->isAdmin()) {
            $client = $this->clientService->getByUserEmail($request->user()->email);
            if (!$client || $booking->client_id !== $client->client_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }
        }

        $amount = $request->amount ?? $booking->total_amount;
        if (!$amount) {
            return response()->json([
                'success' => false,
                'message' => 'Amount is required',
            ], 422);
        }

        $description = $request->description ?? 'Payment for Booking #' . $booking->booking_id;

        $result = $this->paymentService->createPaymentLink($booking, (float) $amount, $description);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment link',
                'error' => $result['error'] ?? 'Unknown error',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'payment_link_id' => $result['payment_link_id'],
                'checkout_url' => $result['checkout_url'],
            ],
        ]);
    }

    /**
     * Handle PayMongo webhook.
     */
    public function webhook(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('Paymongo-Signature');

        // Verify webhook signature
        $webhookSecret = config('services.paymongo.webhook_secret');
        if ($webhookSecret && !$this->paymentService->verifyWebhookSignature($payload, $signature, $webhookSecret)) {
            Log::warning('Invalid webhook signature');
            return response()->json([
                'success' => false,
                'message' => 'Invalid signature',
            ], 401);
        }

        $eventData = json_decode($payload, true);

        if (!$eventData || !isset($eventData['data'])) {
            Log::warning('Invalid webhook payload');
            return response()->json([
                'success' => false,
                'message' => 'Invalid payload',
            ], 400);
        }

        try {
            $this->paymentService->processWebhook($eventData);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Webhook processing failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Processing failed',
            ], 500);
        }
    }
}

