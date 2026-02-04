<?php

namespace App\DTO\Auth;

use App\DTO\BaseDTO;
use Illuminate\Http\Request;

/**
 * Register DTO
 * 
 * Encapsulates user registration data.
 */
class RegisterDTO extends BaseDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
        public readonly ?string $phone = null,
        public readonly string $role = 'client',
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(Request $request): static
    {
        return new static(
            name: $request->input('name'),
            email: $request->input('email'),
            password: $request->input('password'),
            phone: $request->input('phone'),
            role: $request->input('role', 'client'),
        );
    }

    /**
     * Create DTO from array.
     */
    public static function fromArray(array $data): static
    {
        return new static(
            name: $data['name'],
            email: $data['email'],
            password: $data['password'],
            phone: $data['phone'] ?? null,
            role: $data['role'] ?? 'client',
        );
    }

    /**
     * Get data for user creation (excludes password confirmation).
     */
    public function toUserArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'password' => bcrypt($this->password),
            'phone' => $this->phone,
            'role' => $this->role,
        ];
    }

    /**
     * Get first and last name from full name.
     */
    public function getNameParts(): array
    {
        $parts = explode(' ', $this->name, 2);
        return [
            'first_name' => $parts[0] ?? '',
            'last_name' => $parts[1] ?? '',
        ];
    }
}
