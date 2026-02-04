<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Payment;
use App\Services\ClientService;
use App\Traits\CachesPermissions;

class PaymentPolicy
{
    use CachesPermissions;

    protected $clientService;

    public function __construct(ClientService $clientService)
    {
        $this->clientService = $clientService;
    }

    /**
     * Determine if the user can view any payments.
     */
    public function viewAny(User $user): bool
    {
        // Admin can view all payments, clients can view their own
        return true;
    }

    /**
     * Determine if the user can view the payment.
     */
    public function view(User $user, Payment $payment): bool
    {
        return $this->getCachedOrCheck($user, 'view', $payment, function () use ($user, $payment) {
            // Admin can view all payments
            if ($this->isAdminCached($user)) {
                return true;
            }

            // Clients can only view payments for their own bookings
            $client = $this->clientService->getByUserEmail($user->email);
            if ($client && $payment->booking) {
                return $payment->booking->client_id === $client->client_id;
            }

            return false;
        });
    }

    /**
     * Determine if the user can create payments.
     */
    public function create(User $user): bool
    {
        // Clients can create payments for their bookings, admin can create for any booking (cached)
        return $this->isClientCached($user) || $this->isAdminCached($user);
    }

    /**
     * Determine if the user can update the payment.
     */
    public function update(User $user, Payment $payment): bool
    {
        // Only admin can update payments (cached)
        return $this->getCachedOrCheck($user, 'update', $payment, fn() => $this->isAdminCached($user));
    }

    /**
     * Determine if the user can delete the payment.
     */
    public function delete(User $user, Payment $payment): bool
    {
        // Only admin can delete payments (cached)
        return $this->getCachedOrCheck($user, 'delete', $payment, fn() => $this->isAdminCached($user));
    }

    /**
     * Determine if the user can attach payment method.
     */
    public function attachPaymentMethod(User $user, Payment $payment): bool
    {
        return $this->getCachedOrCheck($user, 'attachPaymentMethod', $payment, function () use ($user, $payment) {
            // Admin can attach payment method to any payment
            if ($this->isAdminCached($user)) {
                return true;
            }

            // Clients can attach payment method to their own payments
            $client = $this->clientService->getByUserEmail($user->email);
            if ($client && $payment->booking) {
                return $payment->booking->client_id === $client->client_id;
            }

            return false;
        });
    }
}
