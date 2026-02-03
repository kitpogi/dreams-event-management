<?php

namespace App\Events;

use App\Models\BookingDetail;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public BookingDetail $booking;
    public string $previousStatus;
    public string $newStatus;

    /**
     * Create a new event instance.
     */
    public function __construct(BookingDetail $booking, string $previousStatus, string $newStatus)
    {
        $this->booking = $booking;
        $this->previousStatus = $previousStatus;
        $this->newStatus = $newStatus;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            // Notify the client who owns the booking
            new PrivateChannel('notifications.' . $this->booking->user_id),
            // Notify all admins
            new PrivateChannel('admin.notifications'),
        ];

        // If there's a coordinator assigned, notify them too
        if ($this->booking->coordinator_id) {
            $channels[] = new PrivateChannel('notifications.' . $this->booking->coordinator_id);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'booking.status.changed';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'booking_id' => $this->booking->booking_id,
            'previous_status' => $this->previousStatus,
            'new_status' => $this->newStatus,
            'event_date' => $this->booking->event_date,
            'package_name' => $this->booking->eventPackage?->package_name ?? 'Event',
            'client_name' => $this->booking->user?->name ?? 'Client',
            'updated_at' => now()->toISOString(),
        ];
    }
}
