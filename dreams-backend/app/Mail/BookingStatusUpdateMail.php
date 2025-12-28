<?php

namespace App\Mail;

use App\Models\BookingDetail;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingStatusUpdateMail extends Mailable
{
    use Queueable, SerializesModels;

    public $booking;
    public $oldStatus;
    public $newStatus;

    /**
     * Create a new message instance.
     */
    public function __construct(BookingDetail $booking, string $oldStatus, string $newStatus)
    {
        $this->booking = $booking;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $statusLabels = [
            'Pending' => 'Pending Review',
            'Approved' => 'Approved',
            'Completed' => 'Completed',
            'Cancelled' => 'Cancelled',
        ];

        $statusLabel = $statusLabels[$this->newStatus] ?? $this->newStatus;

        return new Envelope(
            subject: 'Booking Status Update - ' . $statusLabel,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.booking-status-update',
            with: [
                'booking' => $this->booking,
                'client' => $this->booking->client,
                'package' => $this->booking->eventPackage,
                'oldStatus' => $this->oldStatus,
                'newStatus' => $this->newStatus,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

