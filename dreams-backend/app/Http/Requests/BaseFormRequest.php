<?php

namespace App\Http\Requests;

use App\Services\InputSanitizerService;
use App\Services\ValidationTranslationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Lang;

abstract class BaseFormRequest extends FormRequest
{
    /**
     * Input sanitizer service.
     */
    protected InputSanitizerService $sanitizer;

    /**
     * Prepare the data for validation.
     * This method is called before validation rules are applied.
     */
    protected function prepareForValidation(): void
    {
        $this->sanitizer = app(InputSanitizerService::class);
        
        // Get all input data
        $input = $this->all();
        
        // Sanitize all string inputs
        $sanitized = $this->sanitizer->sanitizeRequest($input);
        
        // Merge sanitized data back into request
        $this->merge($sanitized);
    }

    /**
     * Get validated data with sanitization applied.
     * Override this if you need custom sanitization logic.
     *
     * @return array
     */
    public function validated($key = null, $default = null): array
    {
        $validated = parent::validated($key, $default);
        
        // Additional sanitization can be applied here if needed
        // The data is already sanitized in prepareForValidation()
        
        return $validated;
    }

    /**
     * Get custom validation messages.
     * Automatically loads translated messages from custom_validation.php
     *
     * @return array
     */
    public function messages(): array
    {
        $translationService = app(ValidationTranslationService::class);
        $locale = $this->getPreferredLocale();
        
        // Get translated messages for the rules defined in this request
        $translatedMessages = $translationService->getMessagesForRules($this->rules(), $locale);
        
        // Merge with any custom messages defined in child classes
        return array_merge($translatedMessages, $this->customMessages());
    }

    /**
     * Define custom messages for this specific form request.
     * Override in child classes if needed.
     *
     * @return array
     */
    protected function customMessages(): array
    {
        return [];
    }

    /**
     * Get the preferred locale for validation messages.
     *
     * @return string|null
     */
    protected function getPreferredLocale(): ?string
    {
        // Check Accept-Language header
        $acceptLanguage = $this->header('Accept-Language');
        
        if ($acceptLanguage) {
            // Parse the Accept-Language header
            $locales = $this->parseAcceptLanguage($acceptLanguage);
            
            $translationService = app(ValidationTranslationService::class);
            
            foreach ($locales as $locale) {
                if ($translationService->isLocaleSupported($locale)) {
                    return $locale;
                }
            }
        }

        // Fall back to app locale
        return config('app.locale');
    }

    /**
     * Parse Accept-Language header.
     *
     * @param string $header
     * @return array
     */
    protected function parseAcceptLanguage(string $header): array
    {
        $locales = [];
        
        $parts = explode(',', $header);
        foreach ($parts as $part) {
            $components = explode(';', trim($part));
            $locale = trim($components[0]);
            
            // Normalize locale (e.g., en-US -> en)
            $locale = strtolower(explode('-', $locale)[0]);
            
            if (!in_array($locale, $locales)) {
                $locales[] = $locale;
            }
        }

        return $locales;
    }
}
