<?php

namespace App\Services;

use App\Models\Client;
use App\Models\User;

class ClientService
{
    /**
     * Find or create client from authenticated user
     */
    public function findOrCreateFromUser(User $user)
    {
        return Client::firstOrCreate(
            ['client_email' => $user->email],
            [
                'client_lname' => !empty($user->name) ? $user->name : 'Client',
                'client_fname' => !empty($user->name) ? $user->name : 'Client',
                'client_mname' => null,
                'client_contact' => $user->phone ?? '',
                'client_address' => '',
                'client_password' => $user->password ?? '',
            ]
        );
    }

    /**
     * Get client by user email
     */
    public function getByUserEmail(string $email)
    {
        return Client::where('client_email', $email)->first();
    }
}

