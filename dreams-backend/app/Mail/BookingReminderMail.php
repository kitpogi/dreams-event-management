<?php

namespace App\Mail;

use App\Models\BookingDetail;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $booking;
    public $reminderType; // '1_week' or '1_day'
    public $daysUntilEvent;

    /**
     * Create a new message instance.
     */
    public function __construct(BookingDetail $booking, string $reminderType)
    {
        $this->booking = $booking;
        $this->reminderType = $reminderType;
        
        // Calculate days until event
        $eventDate = \Carbon\Carbon::parse($booking->event_date);
        $this->daysUntilEvent = now()->diffInDays($eventDate, false);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->reminderType === '1_week' 
            ? 'Reminder: Your Event is in 1 Week - ' . ($this->booking->eventPackage->package_name ?? 'Event')
            : 'Reminder: Your Event is Tomorrow - ' . ($this->booking->eventPackage->package_name ?? 'Event');
            
        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.booking-reminder',
            with: [
                'booking' => $this->booking,
                'client' => $this->booking->client,
                'package' => $this->booking->eventPackage,
                'reminderType' => $this->reminderType,
                'daysUntilEvent' => $this->daysUntilEvent,
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
