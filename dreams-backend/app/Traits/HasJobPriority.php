<?php

namespace App\Traits;

use App\Services\JobManagementService;

trait HasJobPriority
{
    /**
     * The job priority.
     */
    protected string $priority = JobManagementService::PRIORITY_NORMAL;

    /**
     * Set job priority to low.
     */
    public function lowPriority(): self
    {
        $this->priority = JobManagementService::PRIORITY_LOW;
        return $this;
    }

    /**
     * Set job priority to normal.
     */
    public function normalPriority(): self
    {
        $this->priority = JobManagementService::PRIORITY_NORMAL;
        return $this;
    }

    /**
     * Set job priority to high.
     */
    public function highPriority(): self
    {
        $this->priority = JobManagementService::PRIORITY_HIGH;
        return $this;
    }

    /**
     * Set job priority to urgent.
     */
    public function urgentPriority(): self
    {
        $this->priority = JobManagementService::PRIORITY_URGENT;
        return $this;
    }

    /**
     * Set job priority.
     */
    public function withPriority(string $priority): self
    {
        $this->priority = $priority;
        return $this;
    }

    /**
     * Get job priority.
     */
    public function getPriority(): string
    {
        return $this->priority;
    }

    /**
     * Get the queue that this job should be dispatched to based on priority.
     */
    public function getPriorityQueue(): string
    {
        return match ($this->priority) {
            JobManagementService::PRIORITY_URGENT => 'urgent',
            JobManagementService::PRIORITY_HIGH => 'high',
            JobManagementService::PRIORITY_LOW => 'low',
            default => 'default',
        };
    }

    /**
     * Override the queue property based on priority.
     */
    public function onPriorityQueue(): self
    {
        $this->queue = $this->getPriorityQueue();
        return $this;
    }

    /**
     * Get the delay for low priority jobs.
     */
    public function getPriorityDelay(): ?int
    {
        return match ($this->priority) {
            JobManagementService::PRIORITY_LOW => 300, // 5 minutes
            JobManagementService::PRIORITY_NORMAL => 0,
            default => 0,
        };
    }

    /**
     * Apply priority delay if applicable.
     */
    public function withPriorityDelay(): self
    {
        $delay = $this->getPriorityDelay();
        
        if ($delay > 0) {
            $this->delay = $delay;
        }
        
        return $this;
    }
}
