<?php

namespace App\DTOs\Responses;

class TaskResponseDTO
{
    public function __construct(
        public int $id,
        public int $booking_id,
        public ?int $coordinator_id,
        public string $task_title,
        public string $task_description,
        public string $priority,
        public string $due_date,
        public string $status,
        public ?string $completed_at,
        public string $created_at,
        public string $updated_at,
    ) {}

    /**
     * Create DTO from model
     */
    public static function fromModel($model): self
    {
        return new self(
            id: $model->id,
            booking_id: $model->booking_id,
            coordinator_id: $model->coordinator_id,
            task_title: $model->task_title,
            task_description: $model->task_description,
            priority: $model->priority,
            due_date: $model->due_date,
            status: $model->status,
            completed_at: $model->completed_at?->toIso8601String(),
            created_at: $model->created_at->toIso8601String(),
            updated_at: $model->updated_at->toIso8601String(),
        );
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'booking_id' => $this->booking_id,
            'coordinator_id' => $this->coordinator_id,
            'task_title' => $this->task_title,
            'task_description' => $this->task_description,
            'priority' => $this->priority,
            'due_date' => $this->due_date,
            'status' => $this->status,
            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
