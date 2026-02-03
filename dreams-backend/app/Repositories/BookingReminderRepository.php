<?php

namespace App\Repositories;

use App\Models\BookingReminder;

class BookingReminderRepository extends BaseRepository
{
    public function __construct(BookingReminder $model)
    {
        parent::__construct($model);
        $this->orderBy = 'reminder_date';
        $this->orderDirection = 'asc';
    }

    /**
     * Get reminders by booking
     */
    public function getByBooking(int $bookingId)
    {
        return $this->model
            ->with($this->relations)
            ->where('booking_id', $bookingId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get pending reminders
     */
    public function getPending(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'pending')
            ->where('reminder_date', '<=', now())
            ->orderBy('reminder_date', 'asc')
            ->paginate($perPage);
    }

    /**
     * Get sent reminders
     */
    public function getSent(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'sent')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get failed reminders
     */
    public function getFailed()
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'failed')
            ->orderBy('reminder_date', 'asc')
            ->get();
    }

    /**
     * Get upcoming reminders
     */
    public function getUpcoming(int $days = 7)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'pending')
            ->whereBetween('reminder_date', [now(), now()->addDays($days)])
            ->orderBy('reminder_date', 'asc')
            ->get();
    }

    /**
     * Get reminders by type
     */
    public function getByType(string $reminderType)
    {
        return $this->model
            ->with($this->relations)
            ->where('reminder_type', $reminderType)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get email reminders
     */
    public function getEmailReminders(int $perPage = 15)
    {
        return $this->getByType('email');
    }

    /**
     * Get SMS reminders
     */
    public function getSmsReminders(int $perPage = 15)
    {
        return $this->getByType('sms');
    }

    /**
     * Get reminders by date
     */
    public function getByDate(\DateTime $date, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->whereDate('reminder_date', $date)
            ->orderBy('reminder_date', 'asc')
            ->paginate($perPage);
    }
}
