<?php

namespace Tests\Unit\Validation;

use Tests\TestCase;
use Illuminate\Support\Facades\Validator;

class PasswordValidationTest extends TestCase
{
    /**
     * Test strong password validation rule
     */
    public function test_strong_password_requires_uppercase(): void
    {
        $validator = Validator::make(
            ['password' => 'password123'],
            ['password' => 'required|min:8|regex:/[A-Z]/|regex:/[a-z]/|regex:/[0-9]/|regex:/[!@#$%^&*]/']
        );

        $this->assertTrue($validator->fails());
    }

    /**
     * Test strong password requires lowercase
     */
    public function test_strong_password_requires_lowercase(): void
    {
        $validator = Validator::make(
            ['password' => 'PASSWORD123!'],
            ['password' => 'required|min:8|regex:/[A-Z]/|regex:/[a-z]/|regex:/[0-9]/|regex:/[!@#$%^&*]/']
        );

        $this->assertTrue($validator->fails());
    }

    /**
     * Test strong password requires number
     */
    public function test_strong_password_requires_number(): void
    {
        $validator = Validator::make(
            ['password' => 'Password!'],
            ['password' => 'required|min:8|regex:/[A-Z]/|regex:/[a-z]/|regex:/[0-9]/|regex:/[!@#$%^&*]/']
        );

        $this->assertTrue($validator->fails());
    }

    /**
     * Test strong password requires special character
     */
    public function test_strong_password_requires_special_character(): void
    {
        $validator = Validator::make(
            ['password' => 'Password123'],
            ['password' => 'required|min:8|regex:/[A-Z]/|regex:/[a-z]/|regex:/[0-9]/|regex:/[!@#$%^&*]/']
        );

        $this->assertTrue($validator->fails());
    }

    /**
     * Test valid strong password passes
     */
    public function test_valid_strong_password_passes(): void
    {
        $validator = Validator::make(
            ['password' => 'Password@123'],
            ['password' => 'required|min:8|regex:/[A-Z]/|regex:/[a-z]/|regex:/[0-9]/|regex:/[!@#$%^&*]/']
        );

        $this->assertFalse($validator->fails());
    }

    /**
     * Test password confirmation
     */
    public function test_password_confirmation_required(): void
    {
        $validator = Validator::make(
            [
                'password' => 'Password@123',
                'password_confirmation' => 'DifferentPassword@123',
            ],
            [
                'password' => 'required|min:8|confirmed',
            ]
        );

        $this->assertTrue($validator->fails());
    }

    /**
     * Test password confirmation match
     */
    public function test_password_confirmation_match(): void
    {
        $validator = Validator::make(
            [
                'password' => 'Password@123',
                'password_confirmation' => 'Password@123',
            ],
            [
                'password' => 'required|min:8|confirmed',
            ]
        );

        $this->assertFalse($validator->fails());
    }
}
