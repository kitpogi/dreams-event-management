<?php

namespace App\DTO\Booking;

use App\DTO\BaseDTO;
use App\Models\BookingDetail;
use App\Models\Client;
use App\Models\EventPackage;
use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * Booking Response DTO
 * 
 * Encapsulates booking data for API responses.
 * Provides a consistent structure for booking information.
 */
class BookingResponseDTO extends BaseDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $packageId,
        public readonly ?int $clientId,
        public readonly string $eventDate,
        public readonly ?string $eventVenue,
        public readonly ?string $eventTime,
        public readonly ?int $guestCount,
        public readonly ?string $specialRequests,
        public readonly string $status,
        public readonly ?string $eventTheme,
        public readonly float $totalAmount,
        public readonly float $paidAmount,
        public readonly float $balanceAmount,
        public readonly string $paymentStatus,
        public readonly ?string $notes,
        public readonly string $createdAt,
        public readonly string $updatedAt,
        public readonly ?array $package = null,
        public readonly ?array $client = null,
        public readonly ?array $payments = null,
    ) {}

    /**
     * Create DTO from a BookingDetail model.
     */
    public static function fromModel(BookingDetail $booking, bool $includeRelations = true): static
    {
        $package = null;
        $client = null;
        $payments = null;

        if ($includeRelations) {
            if ($booking->relationLoaded('eventPackage') && $booking->eventPackage) {
                $package = [
                    'id' => $booking->eventPackage->id,
                    'name' => $booking->eventPackage->package_name,
                    'type' => $booking->eventPackage->event_type,
                    'price' => (float) $booking->eventPackage->package_price,
                    'image' => $booking->eventPackage->package_image,
                ];
            }

            if ($booking->relationLoaded('client') && $booking->client) {
                $client = [
                    'id' => $booking->client->id,
                    'name' => trim(($booking->client->client_fname ?? '') . ' ' . ($booking->client->client_lname ?? '')),
                    'email' => $booking->client->client_email,
                    'phone' => $booking->client->client_phone,
                ];
            }

            if ($booking->relationLoaded('payments')) {
                $payments = $booking->payments->map(fn($payment) => [
                    'id' => $payment->id,
                    'amount' => (float) $payment->amount,
                    'status' => $payment->status,
                    'method' => $payment->payment_method,
                    'paid_at' => $payment->paid_at?->toISOString(),
                ])->toArray();
            }
        }

        return new static(
            id: $booking->id,
            packageId: $booking->package_id,
            clientId: $booking->client_id,
            eventDate: $booking->event_date instanceof Carbon 
                ? $booking->event_date->toDateString() 
                : $booking->event_date,
            eventVenue: $booking->event_venue,
            eventTime: $booking->event_time,
            guestCount: $booking->guest_count,
            specialRequests: $booking->special_requests,
            status: $booking->booking_status,
            eventTheme: $booking->event_theme,
            totalAmount: (float) ($booking->total_amount ?? 0),
            paidAmount: (float) ($booking->paid_amount ?? 0),
            balanceAmount: (float) ($booking->balance_amount ?? $booking->total_amount ?? 0),
            paymentStatus: $booking->payment_status ?? 'pending',
            notes: $booking->notes,
            createdAt: $booking->created_at->toISOString(),
            updatedAt: $booking->updated_at->toISOString(),
            package: $package,
            client: $client,
            payments: $payments,
        );
    }

    /**
     * Create DTO from request (not typically used for responses).
     */
    public static function fromRequest(Request $request): static
    {
        throw new \BadMethodCallException('BookingResponseDTO cannot be created from request.');
    }

    /**
     * Create DTO from array.
     */
    public static function fromArray(array $data): static
    {
        return new static(
            id: (int) $data['id'],
            packageId: (int) $data['package_id'],
            clientId: isset($data['client_id']) ? (int) $data['client_id'] : null,
            eventDate: $data['event_date'],
            eventVenue: $data['event_venue'] ?? null,
            eventTime: $data['event_time'] ?? null,
            guestCount: isset($data['guest_count']) ? (int) $data['guest_count'] : null,
            specialRequests: $data['special_requests'] ?? null,
            status: $data['booking_status'] ?? $data['status'] ?? 'pending',
            eventTheme: $data['event_theme'] ?? null,
            totalAmount: (float) ($data['total_amount'] ?? 0),
            paidAmount: (float) ($data['paid_amount'] ?? 0),
            balanceAmount: (float) ($data['balance_amount'] ?? 0),
            paymentStatus: $data['payment_status'] ?? 'pending',
            notes: $data['notes'] ?? null,
            createdAt: $data['created_at'],
            updatedAt: $data['updated_at'],
            package: $data['package'] ?? null,
            client: $data['client'] ?? null,
            payments: $data['payments'] ?? null,
        );
    }

    /**
     * Check if the booking is upcoming.
     */
    public function isUpcoming(): bool
    {
        return Carbon::parse($this->eventDate)->isFuture();
    }

    /**
     * Check if the booking is fully paid.
     */
    public function isFullyPaid(): bool
    {
        return $this->balanceAmount <= 0;
    }

    /**
     * Get a summary string.
     */
    public function getSummary(): string
    {
        $packageName = $this->package['name'] ?? 'Package #' . $this->packageId;
        return "{$packageName} on {$this->eventDate}";
    }
}
