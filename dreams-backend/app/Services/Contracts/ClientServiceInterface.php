<?php

namespace App\Services\Contracts;

use App\Models\User;
use App\Models\Client;

/**
 * Contract for Client Service operations.
 */
interface ClientServiceInterface
{
    /**
     * Find or create a client from a user.
     *
     * @param User $user
     * @return Client
     */
    public function findOrCreateFromUser(User $user): Client;

    /**
     * Get client by email.
     *
     * @param string $email
     * @return Client|null
     */
    public function getByEmail(string $email): ?Client;

    /**
     * Get client by user email.
     *
     * @param string $email
     * @return Client|null
     */
    public function getByUserEmail(string $email): ?Client;

    /**
     * Update client information.
     *
     * @param int $clientId
     * @param array $data
     * @return Client
     */
    public function updateClient(int $clientId, array $data): Client;

    /**
     * Get client booking history.
     *
     * @param int $clientId
     * @param int $perPage
     * @return mixed
     */
    public function getBookingHistory(int $clientId, int $perPage = 15);

    /**
     * Get client preferences summary.
     *
     * @param int $clientId
     * @return array
     */
    public function getPreferencesSummary(int $clientId): array;

    /**
     * Get client statistics.
     *
     * @param int $clientId
     * @return array
     */
    public function getClientStatistics(int $clientId): array;
}
