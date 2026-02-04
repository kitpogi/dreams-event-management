<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * User Repository Interface
 * 
 * Defines the contract for user-specific repository operations.
 */
interface UserRepositoryInterface extends RepositoryInterface
{
    /**
     * Find a user by email.
     *
     * @param string $email
     * @return User|null
     */
    public function findByEmail(string $email): ?User;

    /**
     * Get users by role.
     *
     * @param string $role
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getByRole(string $role, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get all admins.
     *
     * @return Collection
     */
    public function getAdmins(): Collection;

    /**
     * Get all coordinators.
     *
     * @return Collection
     */
    public function getCoordinators(): Collection;

    /**
     * Get all clients.
     *
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getClients(int $perPage = 15): LengthAwarePaginator;

    /**
     * Search users.
     *
     * @param string $query
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function search(string $query, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get users with expired passwords.
     *
     * @return Collection
     */
    public function getWithExpiredPasswords(): Collection;

    /**
     * Get users with 2FA enabled.
     *
     * @return Collection
     */
    public function getWith2FAEnabled(): Collection;

    /**
     * Update user password.
     *
     * @param int $userId
     * @param string $hashedPassword
     * @return User
     */
    public function updatePassword(int $userId, string $hashedPassword): User;

    /**
     * Update user role.
     *
     * @param int $userId
     * @param string $role
     * @return User
     */
    public function updateRole(int $userId, string $role): User;

    /**
     * Get recently registered users.
     *
     * @param int $days
     * @param int $limit
     * @return Collection
     */
    public function getRecentlyRegistered(int $days = 7, int $limit = 10): Collection;

    /**
     * Get user statistics.
     *
     * @return array
     */
    public function getStatistics(): array;

    /**
     * Get inactive users.
     *
     * @param int $days Days since last login
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getInactive(int $days = 30, int $perPage = 15): LengthAwarePaginator;
}
