<?php

namespace App\Repositories;

use App\Models\Task;

class TaskRepository extends BaseRepository
{
    public function __construct(Task $model)
    {
        parent::__construct($model);
        $this->orderBy = 'due_date';
        $this->orderDirection = 'asc';
    }

    /**
     * Get tasks by booking
     */
    public function getByBooking(int $bookingId, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('booking_id', $bookingId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get tasks by coordinator
     */
    public function getByCoordinator(int $coordinatorId, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('coordinator_id', $coordinatorId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get pending tasks
     */
    public function getPending(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'pending')
            ->orderBy('due_date', 'asc')
            ->paginate($perPage);
    }

    /**
     * Get completed tasks
     */
    public function getCompleted(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'completed')
            ->orderBy('completed_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get overdue tasks
     */
    public function getOverdue()
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'pending')
            ->where('due_date', '<', now())
            ->orderBy('due_date', 'asc')
            ->get();
    }

    /**
     * Get tasks due today
     */
    public function getDueToday()
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'pending')
            ->whereDate('due_date', now())
            ->orderBy('due_date', 'asc')
            ->get();
    }

    /**
     * Get tasks due within days
     */
    public function getDueWithin(int $days)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'pending')
            ->whereBetween('due_date', [now(), now()->addDays($days)])
            ->orderBy('due_date', 'asc')
            ->get();
    }

    /**
     * Get tasks by priority
     */
    public function getByPriority(string $priority)
    {
        return $this->model
            ->with($this->relations)
            ->where('priority', $priority)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get high priority pending tasks
     */
    public function getHighPriorityPending()
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'pending')
            ->where('priority', 'high')
            ->orderBy('due_date', 'asc')
            ->get();
    }
}
