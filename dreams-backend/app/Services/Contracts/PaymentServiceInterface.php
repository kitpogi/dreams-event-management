<?php

namespace App\Services\Contracts;

/**
 * Contract for Payment Service operations.
 */
interface PaymentServiceInterface
{
    /**
     * Create a payment intent.
     *
     * @param int $bookingId
     * @param float $amount
     * @param string $currency
     * @param array $metadata
     * @return array
     */
    public function createPaymentIntent(int $bookingId, float $amount, string $currency = 'PHP', array $metadata = []): array;

    /**
     * Confirm a payment.
     *
     * @param string $paymentIntentId
     * @return array
     */
    public function confirmPayment(string $paymentIntentId): array;

    /**
     * Process a refund.
     *
     * @param int $paymentId
     * @param float|null $amount
     * @param string|null $reason
     * @return array
     */
    public function processRefund(int $paymentId, ?float $amount = null, ?string $reason = null): array;

    /**
     * Get payment status.
     *
     * @param string $paymentIntentId
     * @return array
     */
    public function getPaymentStatus(string $paymentIntentId): array;

    /**
     * Handle webhook event.
     *
     * @param string $payload
     * @param string $signature
     * @return array
     */
    public function handleWebhook(string $payload, string $signature): array;

    /**
     * Get payment methods for a customer.
     *
     * @param int $clientId
     * @return array
     */
    public function getPaymentMethods(int $clientId): array;

    /**
     * Calculate deposit amount.
     *
     * @param float $totalAmount
     * @param float $depositPercentage
     * @return float
     */
    public function calculateDeposit(float $totalAmount, float $depositPercentage = 0.30): float;

    /**
     * Get booking payment summary.
     *
     * @param int $bookingId
     * @return array
     */
    public function getBookingPaymentSummary(int $bookingId): array;
}
