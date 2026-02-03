<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BookingDetail;
use App\Models\Payment;
use App\Services\PaymentService;
use App\Services\ClientService;
use App\Http\Requests\Payment\CreatePaymentIntentRequest;
use App\Http\Requests\Payment\AttachPaymentMethodRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
    public function createPaymentIntent(CreatePaymentIntentRequest $request)
    {
        $validated = $request->validated();

        $booking = BookingDetail::with(['client', 'eventPackage'])->findOrFail($validated['booking_id']);

        // Verify user owns the booking or is admin
        if (!$request->user()->isAdmin()) {
            $client = $this->clientService->getByUserEmail($request->user()->email);
            if (!$client || $booking->client_id !== $client->client_id) {
                return $this->forbiddenResponse('Unauthorized');
            }
        }

        // Use bcmath or round to ensure precision (convert to string then back to float for precision)
        $amount = round((float) $validated['amount'], 2);
        $paymentMethods = $validated['payment_methods'] ?? ['card', 'gcash', 'maya'];

        $result = $this->paymentService->createPaymentIntent($booking, $amount, 'PHP', $paymentMethods);

        if (!$result['success']) {
            return $this->serverErrorResponse(
                'Failed to create payment intent',
                ['error' => $result['error'] ?? 'Unknown error']
            );
        }

        // Create payment record
        $payment = Payment::create([
            'booking_id' => $booking->booking_id,
            'payment_intent_id' => $result['payment_intent_id'],
            'amount' => $result['amount'],
            'currency' => $result['currency'],
            'status' => 'pending',
        ]);

        return $this->successResponse([
            'payment_id' => $payment->id,
            'payment_intent_id' => $result['payment_intent_id'],
            'client_key' => $result['client_key'],
            'amount' => $result['amount'],
            'currency' => $result['currency'],
        ], 'Payment intent created successfully');
    }

    /**
     * Attach payment method to payment intent.
     */
    public function attachPaymentMethod(AttachPaymentMethodRequest $request)
    {
        $validated = $request->validated();

        $result = $this->paymentService->attachPaymentMethod(
            $validated['payment_intent_id'],
            $validated['payment_method_id']
        );

        if (!$result['success']) {
            return $this->serverErrorResponse(
                'Failed to attach payment method',
                ['error' => $result['error'] ?? 'Unknown error']
            );
        }

        // Update payment record
        $payment = Payment::where('payment_intent_id', $validated['payment_intent_id'])->first();
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

        return $this->successResponse($payment->load('booking'), 'Payment method attached successfully');
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

        // Validate amount with strict rules
        $validator = Validator::make(['amount' => $amount], [
            'amount' => [
                'required',
                'numeric',
                'min:0.01',
                'max:99999999.99',
                function ($attribute, $value, $fail) {
                    if (preg_match('/\.\d{3,}/', (string)$value)) {
                        $fail('The amount must have at most 2 decimal places.');
                    }
                    if ($value <= 0) {
                        $fail('The amount must be greater than 0.');
                    }
                },
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid amount',
                'errors' => $validator->errors(),
            ], 422);
        }

        $description = $request->description ?? 'Payment for Booking #' . $booking->booking_id;

        // Use round to ensure precision
        $result = $this->paymentService->createPaymentLink($booking, round((float) $amount, 2), $description);

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

