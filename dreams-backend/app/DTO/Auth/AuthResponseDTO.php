<?php

namespace App\DTO\Auth;

use App\DTO\BaseDTO;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Auth Response DTO
 * 
 * Encapsulates authentication response data.
 */
class AuthResponseDTO extends BaseDTO
{
    public function __construct(
        public readonly int $userId,
        public readonly string $name,
        public readonly string $email,
        public readonly string $role,
        public readonly ?string $accessToken = null,
        public readonly ?string $tokenType = 'Bearer',
        public readonly ?int $expiresIn = null,
        public readonly bool $twoFactorRequired = false,
        public readonly bool $twoFactorEnabled = false,
        public readonly ?string $phone = null,
        public readonly ?string $profileImage = null,
    ) {}

    /**
     * Create DTO from user model with token.
     */
    public static function fromUserWithToken(User $user, string $token, ?int $expiresIn = null): static
    {
        return new static(
            userId: $user->id,
            name: $user->name,
            email: $user->email,
            role: $user->role ?? 'client',
            accessToken: $token,
            tokenType: 'Bearer',
            expiresIn: $expiresIn,
            twoFactorRequired: false,
            twoFactorEnabled: (bool) $user->two_factor_enabled,
            phone: $user->phone,
            profileImage: $user->profile_image,
        );
    }

    /**
     * Create DTO for 2FA required response.
     */
    public static function twoFactorRequired(User $user): static
    {
        return new static(
            userId: $user->id,
            name: $user->name,
            email: $user->email,
            role: $user->role ?? 'client',
            accessToken: null,
            tokenType: null,
            expiresIn: null,
            twoFactorRequired: true,
            twoFactorEnabled: true,
            phone: $user->phone,
            profileImage: $user->profile_image,
        );
    }

    /**
     * Create DTO from request (not typically used for responses).
     */
    public static function fromRequest(Request $request): static
    {
        throw new \BadMethodCallException('AuthResponseDTO cannot be created from request.');
    }

    /**
     * Create DTO from array.
     */
    public static function fromArray(array $data): static
    {
        return new static(
            userId: (int) $data['user_id'],
            name: $data['name'],
            email: $data['email'],
            role: $data['role'] ?? 'client',
            accessToken: $data['access_token'] ?? null,
            tokenType: $data['token_type'] ?? 'Bearer',
            expiresIn: isset($data['expires_in']) ? (int) $data['expires_in'] : null,
            twoFactorRequired: (bool) ($data['two_factor_required'] ?? false),
            twoFactorEnabled: (bool) ($data['two_factor_enabled'] ?? false),
            phone: $data['phone'] ?? null,
            profileImage: $data['profile_image'] ?? null,
        );
    }

    /**
     * Check if authentication was successful.
     */
    public function isAuthenticated(): bool
    {
        return $this->accessToken !== null && !$this->twoFactorRequired;
    }

    /**
     * Get response array for API.
     */
    public function toApiResponse(): array
    {
        $response = [
            'user' => [
                'id' => $this->userId,
                'name' => $this->name,
                'email' => $this->email,
                'role' => $this->role,
                'phone' => $this->phone,
                'profile_image' => $this->profileImage,
                'two_factor_enabled' => $this->twoFactorEnabled,
            ],
        ];

        if ($this->twoFactorRequired) {
            $response['two_factor_required'] = true;
            $response['message'] = 'Two-factor authentication required';
        } else {
            $response['access_token'] = $this->accessToken;
            $response['token_type'] = $this->tokenType;
            if ($this->expiresIn !== null) {
                $response['expires_in'] = $this->expiresIn;
            }
        }

        return $response;
    }
}
