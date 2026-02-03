<?php

namespace App\DTOs\Requests;

class ContactInquiryRequestDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $phone,
        public string $subject,
        public string $message,
    ) {}

    /**
     * Create DTO from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            phone: $data['phone'],
            subject: $data['subject'],
            message: $data['message'],
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'subject' => $this->subject,
            'message' => $this->message,
        ];
    }
}
