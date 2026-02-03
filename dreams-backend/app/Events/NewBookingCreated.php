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

class NewBookingCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public BookingDetail $booking;

    /**
     * Create a new event instance.
     */
    public function __construct(BookingDetail $booking)
    {
        $this->booking = $booking;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            // Notify all admins about new bookings
            new PrivateChannel('admin.notifications'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'booking.created';
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
            'status' => $this->booking->booking_status,
            'event_date' => $this->booking->event_date,
            'package_name' => $this->booking->eventPackage?->package_name ?? 'Event',
            'client_name' => $this->booking->user?->name ?? 'Client',
            'client_email' => $this->booking->user?->email ?? '',
            'created_at' => $this->booking->created_at->toISOString(),
        ];
    }
}
