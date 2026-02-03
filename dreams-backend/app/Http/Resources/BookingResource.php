<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Calculate payment summary
        $totalPaid = round((float) $this->payments()
            ->where('status', 'paid')
            ->sum('amount'), 2);
        
        $totalAmount = round((float) ($this->total_amount ?? 0), 2);
        $remainingBalance = round(max(0, $totalAmount - $totalPaid), 2);

        return [
            'booking_id' => $this->booking_id,
            'client_id' => $this->client_id,
            'package_id' => $this->package_id,
            'coordinator_id' => $this->coordinator_id,
            'event_date' => $this->event_date?->format('Y-m-d'),
            'event_time' => $this->event_time,
            'event_venue' => $this->event_venue,
            'guest_count' => $this->guest_count,
            'booking_status' => $this->booking_status,
            'special_requests' => $this->special_requests,
            'internal_notes' => $this->internal_notes,
            'event_type' => $this->event_type,
            'theme' => $this->theme,
            'budget_range' => $this->budget_range,
            'alternate_contact' => $this->alternate_contact,
            'total_amount' => $totalAmount,
            'deposit_amount' => round((float) ($this->deposit_amount ?? 0), 2),
            'payment_required' => $this->payment_required ?? true,
            'payment_status' => $this->payment_status ?? 'unpaid',
            'total_paid' => $totalPaid,
            'remaining_balance' => $remainingBalance,
            'mood_board' => $this->mood_board ?? [],
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Include relationships only when needed (use whenLoaded to check)
            'event_package' => $this->whenLoaded('eventPackage', function () {
                return [
                    'package_id' => $this->eventPackage->package_id,
                    'package_name' => $this->eventPackage->package_name,
                    'package_price' => round((float) $this->eventPackage->package_price, 2),
                    'package_category' => $this->eventPackage->package_category,
                    'package_image' => $this->eventPackage->package_image,
                ];
            }),
            'client' => $this->whenLoaded('client', function () {
                return [
                    'client_id' => $this->client->client_id,
                    'client_fname' => $this->client->client_fname,
                    'client_lname' => $this->client->client_lname,
                    'client_email' => $this->client->client_email,
                    'client_contact' => $this->client->client_contact,
                ];
            }),
            'coordinator' => $this->whenLoaded('coordinator', function () {
                return [
                    'id' => $this->coordinator->id,
                    'name' => $this->coordinator->name,
                    'email' => $this->coordinator->email,
                ];
            }),
            'payments' => $this->whenLoaded('payments', function () {
                return $this->payments->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'payment_intent_id' => $payment->payment_intent_id,
                        'amount' => round((float) $payment->amount, 2),
                        'currency' => $payment->currency,
                        'status' => $payment->status,
                        'payment_method' => $payment->payment_method,
                        'created_at' => $payment->created_at?->toISOString(),
                    ];
                });
            }),
        ];
    }
}
