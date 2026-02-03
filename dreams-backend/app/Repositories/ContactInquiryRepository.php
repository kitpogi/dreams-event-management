<?php

namespace App\Repositories;

use App\Models\ContactInquiry;

class ContactInquiryRepository extends BaseRepository
{
    public function __construct(ContactInquiry $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get inquiries by status
     */
    public function getByStatus(string $status, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', $status)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get unread inquiries
     */
    public function getUnread()
    {
        return $this->model
            ->with($this->relations)
            ->where('is_read', false)
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Get pending inquiries
     */
    public function getPending(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);
    }

    /**
     * Get resolved inquiries
     */
    public function getResolved(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'resolved')
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get inquiries by email
     */
    public function getByEmail(string $email, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('email', $email)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get inquiries by phone
     */
    public function getByPhone(string $phone)
    {
        return $this->model
            ->with($this->relations)
            ->where('phone', $phone)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Search inquiries
     */
    public function search(string $query, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('subject', 'LIKE', "%{$query}%")
            ->orWhere('message', 'LIKE', "%{$query}%")
            ->orWhere('name', 'LIKE', "%{$query}%")
            ->orWhere('email', 'LIKE', "%{$query}%")
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get recent inquiries
     */
    public function getRecent(int $days = 7, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('created_at', '>=', now()->subDays($days))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Mark inquiry as read
     */
    public function markAsRead(int $inquiryId)
    {
        return $this->model
            ->where('id', $inquiryId)
            ->update(['is_read' => true]);
    }
}
