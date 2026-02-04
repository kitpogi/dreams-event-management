<?php

namespace App\Repositories;

use App\Models\Invoice;
use Illuminate\Pagination\LengthAwarePaginator;

class InvoiceRepository extends BaseRepository
{
    public function __construct(Invoice $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get invoices by booking
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
     * Get invoices by user
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
     * Get invoices by status
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
     * Get unpaid invoices
     */
    public function getUnpaid(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'unpaid')
            ->orderBy('due_date', 'asc')
            ->paginate($perPage);
    }

    /**
     * Get paid invoices
     */
    public function getPaid(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'paid')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get overdue invoices
     */
    public function getOverdue()
    {
        return $this->model
            ->with($this->relations)
            ->where('status', 'unpaid')
            ->where('due_date', '<', now())
            ->orderBy('due_date', 'asc')
            ->get();
    }

    /**
     * Get invoices by date range
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
     * Get invoices by amount range
     */
    public function getByAmountRange(float $minAmount, float $maxAmount)
    {
        return $this->model
            ->with($this->relations)
            ->whereBetween('total_amount', [$minAmount, $maxAmount])
            ->orderBy('total_amount', 'desc')
            ->get();
    }

    /**
     * Get total revenue from paid invoices
     */
    public function getTotalRevenue()
    {
        return $this->model
            ->where('status', 'paid')
            ->sum('total_amount');
    }

    /**
     * Search invoices with pagination
     */
    public function searchPaginated(string $query, int $perPage = 15): \Illuminate\Pagination\LengthAwarePaginator
    {
        return $this->model
            ->with($this->relations)
            ->where('invoice_number', 'LIKE', "%{$query}%")
            ->orWhere('client_name', 'LIKE', "%{$query}%")
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }
}
