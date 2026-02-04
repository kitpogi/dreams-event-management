<?php

namespace App\DTO\Auth;

use App\DTO\BaseDTO;
use Illuminate\Http\Request;

/**
 * Login DTO
 * 
 * Encapsulates login request data.
 */
class LoginDTO extends BaseDTO
{
    public function __construct(
        public readonly string $email,
        public readonly string $password,
        public readonly bool $rememberMe = false,
        public readonly ?string $deviceName = null,
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(Request $request): static
    {
        return new static(
            email: $request->input('email'),
            password: $request->input('password'),
            rememberMe: (bool) $request->input('remember_me', false),
            deviceName: $request->input('device_name') ?? $request->userAgent(),
        );
    }

    /**
     * Create DTO from array.
     */
    public static function fromArray(array $data): static
    {
        return new static(
            email: $data['email'],
            password: $data['password'],
            rememberMe: (bool) ($data['remember_me'] ?? $data['rememberMe'] ?? false),
            deviceName: $data['device_name'] ?? $data['deviceName'] ?? null,
        );
    }

    /**
     * Get credentials array for authentication.
     */
    public function getCredentials(): array
    {
        return [
            'email' => $this->email,
            'password' => $this->password,
        ];
    }
}
