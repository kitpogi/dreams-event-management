<?php

namespace App\Traits;

use App\Services\InputSanitizerService;

trait SanitizesInput
{
    /**
     * Get the sanitizer service instance.
     *
     * @return InputSanitizerService
     */
    protected function getSanitizer(): InputSanitizerService
    {
        return app(InputSanitizerService::class);
    }

    /**
     * Sanitize the request data after validation.
     * Override this method in FormRequest classes to customize sanitization.
     *
     * @return array
     */
    protected function sanitizeInput(): array
    {
        $sanitizer = $this->getSanitizer();
        $data = $this->validated();

        // Define which fields need special sanitization
        $sanitizationRules = $this->getSanitizationRules();

        foreach ($data as $key => $value) {
            if (is_string($value)) {
                // Get sanitization type for this field, or default to 'string'
                $type = $sanitizationRules[$key] ?? 'string';
                $data[$key] = $sanitizer->sanitizeByType($value, $type);
            } elseif (is_array($value)) {
                // Recursively sanitize arrays
                $data[$key] = $sanitizer->sanitizeArray($value);
            }
        }

        return $data;
    }

    /**
     * Get sanitization rules for fields.
     * Override this method in FormRequest classes to specify field types.
     *
     * @return array
     */
    protected function getSanitizationRules(): array
    {
        return [];
    }

    /**
     * Get validated and sanitized data.
     *
     * @param string|null $key
     * @param mixed $default
     * @return array|mixed
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);

        // If we have a key, sanitize just that value
        if ($key !== null) {
            if (isset($validated)) {
                $sanitizer = $this->getSanitizer();
                $rules = $this->getSanitizationRules();
                $type = $rules[$key] ?? 'string';
                
                if (is_string($validated)) {
                    return $sanitizer->sanitizeByType($validated, $type);
                }
            }
            return $validated ?? $default;
        }

        // Sanitize all validated data
        return $this->sanitizeInput();
    }
}
