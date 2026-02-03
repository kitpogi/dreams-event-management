<?php

namespace App\Repositories;

use App\Models\Payment;

class PaymentRepository extends BaseRepository
{
    public function __construct(Payment $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get payments by user
     */
    public function getByUser(int $userId, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('user_id', $userId)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get payments by booking
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
     * Get payments by status
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
     * Get completed payments
     */
    public function getCompleted(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'completed')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get pending payments
     */
    public function getPending()
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Get failed payments
     */
    public function getFailed()
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'failed')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get refunded payments
     */
    public function getRefunded()
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'refunded')
            ->get();
    }

    /**
     * Get payments by date range
     */
    public function getByDateRange(\DateTime $startDate, \DateTime $endDate, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get total revenue
     */
    public function getTotalRevenue()
    {
        return $this->model
            ->where('status', 'completed')
            ->sum('amount');
    }

    /**
     * Get revenue by date range
     */
    public function getRevenueByDateRange(\DateTime $startDate, \DateTime $endDate)
    {
        return $this->model
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');
    }
}
