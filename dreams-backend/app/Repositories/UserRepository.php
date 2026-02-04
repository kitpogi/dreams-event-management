<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class UserRepository extends BaseRepository
{
    public function __construct(User $model)
    {
        parent::__construct($model);
        $this->orderBy = 'created_at';
        $this->orderDirection = 'desc';
    }

    /**
     * Get users by role
     */
    public function getByRole(string $role, int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('role', $role)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get active users
     */
    public function getActive(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->where('is_active', true)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get inactive users
     */
    public function getInactive()
    {
        return $this->model
            ->with($this->relations)
            ->where('is_active', false)
            ->orderBy($this->orderBy, $this->orderDirection)
            ->get();
    }

    /**
     * Get users by email
     */
    public function getByEmail(string $email)
    {
        return $this->model
            ->where('email', $email)
            ->first();
    }

    /**
     * Get users by phone
     */
    public function getByPhone(string $phone)
    {
        return $this->model
            ->with($this->relations)
            ->where('phone', $phone)
            ->first();
    }

    /**
     * Get verified users
     */
    public function getVerified(int $perPage = 15)
    {
        return $this->model
            ->with($this->relations)
            ->whereNotNull('email_verified_at')
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get unverified users
     */
    public function getUnverified()
    {
        return $this->model
            ->with($this->relations)
            ->whereNull('email_verified_at')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Search users with pagination
     */
    public function searchPaginated(string $query, int $perPage = 15): \Illuminate\Pagination\LengthAwarePaginator
    {
        return $this->model
            ->with($this->relations)
            ->where('name', 'LIKE', "%{$query}%")
            ->orWhere('email', 'LIKE', "%{$query}%")
            ->orWhere('phone', 'LIKE', "%{$query}%")
            ->orderBy($this->orderBy, $this->orderDirection)
            ->paginate($perPage);
    }

    /**
     * Get coordinators
     */
    public function getCoordinators(int $perPage = 15)
    {
        return $this->getByRole('coordinator', $perPage);
    }

    /**
     * Get clients
     */
    public function getClients(int $perPage = 15)
    {
        return $this->getByRole('client', $perPage);
    }

    /**
     * Get admins
     */
    public function getAdmins()
    {
        return $this->getByRole('admin', PHP_INT_MAX);
    }
}
