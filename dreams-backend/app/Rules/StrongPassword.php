<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class StrongPassword implements Rule
{
    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value): bool
    {
        // At least 8 characters
        if (strlen($value) < 8) {
            return false;
        }

        // Contains at least one letter
        if (!preg_match('/[a-zA-Z]/', $value)) {
            return false;
        }

        // Contains at least one number
        if (!preg_match('/[0-9]/', $value)) {
            return false;
        }

        // Contains at least one special character
        if (!preg_match('/[^a-zA-Z0-9]/', $value)) {
            return false;
        }

        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message(): string
    {
        return 'The :attribute must be at least 8 characters and contain at least one letter, one number, and one special character.';
    }
}
