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
        $user = $request->user();
        $isAdmin = $user && method_exists($user, 'isAdmin') && $user->isAdmin();
        $isCoordinator = $user && method_exists($user, 'isCoordinator') && $user->isCoordinator();
        $isStaff = $isAdmin || $isCoordinator;

        // Calculate payment summary
        $totalPaid = round((float) $this->payments()
            ->where('status', 'paid')
            ->sum('amount'), 2);
        
        $totalAmount = round((float) ($this->total_amount ?? 0), 2);
        $remainingBalance = round(max(0, $totalAmount - $totalPaid), 2);

        $data = [
            'booking_id' => $this->booking_id,
            'client_id' => $this->client_id,
            'package_id' => $this->package_id,
            'event_date' => $this->event_date?->format('Y-m-d'),
            'event_time' => $this->event_time,
            'event_venue' => $this->event_venue,
            'guest_count' => $this->guest_count,
            'booking_status' => $this->booking_status,
            'special_requests' => $this->special_requests,
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
        ];

        // Staff-only fields (admin and coordinator)
        if ($isStaff) {
            $data['coordinator_id'] = $this->coordinator_id;
            $data['internal_notes'] = $this->internal_notes;
            
            $data['coordinator'] = $this->whenLoaded('coordinator', function () {
                return [
                    'id' => $this->coordinator->id,
                    'name' => $this->coordinator->name,
                    'email' => $this->coordinator->email,
                ];
            });
        }

        // Admin-only fields
        if ($isAdmin) {
            $data['admin_metadata'] = [
                'profit_margin' => $this->profit_margin ?? null,
                'cost_breakdown' => $this->cost_breakdown ?? null,
                'source' => $this->source ?? 'website',
            ];
        }

        // Payment details for staff and booking owner
        $data['payments'] = $this->whenLoaded('payments', function () use ($isStaff) {
            return $this->payments->map(function ($payment) use ($isStaff) {
                $paymentData = [
                    'id' => $payment->id,
                    'amount' => round((float) $payment->amount, 2),
                    'currency' => $payment->currency,
                    'status' => $payment->status,
                    'payment_method' => $payment->payment_method,
                    'created_at' => $payment->created_at?->toISOString(),
                ];

                // Staff can see additional payment details
                if ($isStaff) {
                    $paymentData['payment_intent_id'] = $payment->payment_intent_id;
                    $paymentData['refund_id'] = $payment->refund_id ?? null;
                    $paymentData['failure_reason'] = $payment->failure_reason ?? null;
                }

                return $paymentData;
            });
        });

        return $data;
    }
}
