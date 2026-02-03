<?php

namespace App\Mail;

use App\Models\ContactInquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactInquiryReplyMail extends Mailable
{
    use Queueable, SerializesModels;

    public ContactInquiry $inquiry;
    public string $replyMessage;
    public string $emailSubject;

    /**
     * Create a new message instance.
     */
    public function __construct(ContactInquiry $inquiry, string $replyMessage, string $subject)
    {
        $this->inquiry = $inquiry;
        $this->replyMessage = $replyMessage;
        $this->emailSubject = $subject;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->emailSubject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-inquiry-reply',
            with: [
                'inquiry' => $this->inquiry,
                'replyMessage' => $this->replyMessage,
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

