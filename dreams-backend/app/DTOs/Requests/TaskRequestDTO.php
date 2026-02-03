<?php

namespace App\DTOs\Requests;

class TaskRequestDTO
{
    public function __construct(
        public int $booking_id,
        public string $task_title,
        public string $task_description,
        public string $priority,
        public string $due_date,
        public ?int $coordinator_id = null,
    ) {}

    /**
     * Create DTO from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            booking_id: (int) $data['booking_id'],
            task_title: $data['task_title'],
            task_description: $data['task_description'],
            priority: $data['priority'],
            due_date: $data['due_date'],
            coordinator_id: isset($data['coordinator_id']) ? (int) $data['coordinator_id'] : null,
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'booking_id' => $this->booking_id,
            'task_title' => $this->task_title,
            'task_description' => $this->task_description,
            'priority' => $this->priority,
            'due_date' => $this->due_date,
            'coordinator_id' => $this->coordinator_id,
        ];
    }
}
