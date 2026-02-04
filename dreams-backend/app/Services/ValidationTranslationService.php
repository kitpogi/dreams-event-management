<?php

namespace App\Services;

use Illuminate\Support\Facades\Lang;
use Illuminate\Validation\Validator;

/**
 * Service for translating validation error messages.
 * 
 * This service provides user-friendly validation messages
 * that can be translated for multi-language support.
 */
class ValidationTranslationService
{
    /**
     * Custom validation message file key
     */
    protected const CUSTOM_MESSAGES_KEY = 'custom_validation';

    /**
     * Get translated validation messages for a validator.
     *
     * @param Validator $validator
     * @param string|null $locale
     * @return array
     */
    public function getTranslatedErrors(Validator $validator, ?string $locale = null): array
    {
        $errors = $validator->errors()->toArray();
        $translatedErrors = [];

        foreach ($errors as $field => $messages) {
            $translatedErrors[$field] = array_map(function ($message) use ($field, $locale) {
                return $this->translateMessage($field, $message, $locale);
            }, $messages);
        }

        return $translatedErrors;
    }

    /**
     * Translate a single validation message.
     *
     * @param string $field
     * @param string $message
     * @param string|null $locale
     * @return string
     */
    protected function translateMessage(string $field, string $message, ?string $locale = null): string
    {
        // Extract the rule from the message (approximate)
        $rule = $this->extractRuleFromMessage($message);

        // Try to find a custom translation for this field and rule
        $translationKey = self::CUSTOM_MESSAGES_KEY . ".{$field}.{$rule}";

        if (Lang::has($translationKey, $locale)) {
            return Lang::get($translationKey, [], $locale);
        }

        // Fall back to the original message
        return $message;
    }

    /**
     * Extract the validation rule from an error message.
     *
     * @param string $message
     * @return string
     */
    protected function extractRuleFromMessage(string $message): string
    {
        $rulePatterns = [
            '/required/i' => 'required',
            '/must be a valid email/i' => 'email',
            '/must be an integer/i' => 'integer',
            '/must be a number/i' => 'numeric',
            '/must be a string/i' => 'string',
            '/must be at least \d+/i' => 'min',
            '/may not be greater than \d+/i' => 'max',
            '/must be between/i' => 'between',
            '/must be a date/i' => 'date',
            '/must be after/i' => 'after',
            '/already been taken/i' => 'unique',
            '/does not exist/i' => 'exists',
            '/confirmation does not match/i' => 'confirmed',
            '/must be an image/i' => 'image',
            '/must be a file of type/i' => 'mimes',
        ];

        foreach ($rulePatterns as $pattern => $rule) {
            if (preg_match($pattern, $message)) {
                return $rule;
            }
        }

        return 'unknown';
    }

    /**
     * Get custom messages for a FormRequest.
     *
     * @param array $rules
     * @param string|null $locale
     * @return array
     */
    public function getMessagesForRules(array $rules, ?string $locale = null): array
    {
        $messages = [];

        foreach ($rules as $field => $fieldRules) {
            // Handle both string and array rule definitions
            $ruleList = is_string($fieldRules) ? explode('|', $fieldRules) : $fieldRules;

            foreach ($ruleList as $rule) {
                // Extract rule name (before any parameters)
                $ruleName = is_string($rule) ? explode(':', $rule)[0] : $rule;

                $translationKey = self::CUSTOM_MESSAGES_KEY . ".{$field}.{$ruleName}";

                if (Lang::has($translationKey, $locale)) {
                    $messages["{$field}.{$ruleName}"] = Lang::get($translationKey, [], $locale);
                }
            }
        }

        return $messages;
    }

    /**
     * Get all available translations for a field.
     *
     * @param string $field
     * @param string|null $locale
     * @return array
     */
    public function getFieldTranslations(string $field, ?string $locale = null): array
    {
        $translationKey = self::CUSTOM_MESSAGES_KEY . ".{$field}";

        if (Lang::has($translationKey, $locale)) {
            return Lang::get($translationKey, [], $locale);
        }

        return [];
    }

    /**
     * Check if a locale is supported.
     *
     * @param string $locale
     * @return bool
     */
    public function isLocaleSupported(string $locale): bool
    {
        $langPath = lang_path($locale);
        return is_dir($langPath);
    }

    /**
     * Get available locales.
     *
     * @return array
     */
    public function getAvailableLocales(): array
    {
        $langPath = lang_path();
        $locales = [];

        if (is_dir($langPath)) {
            $directories = scandir($langPath);
            foreach ($directories as $dir) {
                if ($dir !== '.' && $dir !== '..' && is_dir($langPath . '/' . $dir)) {
                    $locales[] = $dir;
                }
            }
        }

        return $locales;
    }
}
