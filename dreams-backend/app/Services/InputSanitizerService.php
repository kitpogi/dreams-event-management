<?php

namespace App\Services;

use Illuminate\Support\Str;

class InputSanitizerService
{
    /**
     * Sanitize a string input.
     * Removes HTML tags and normalizes whitespace.
     *
     * @param string|null $value
     * @param bool $allowHtml Whether to allow HTML (default: false)
     * @return string|null
     */
    public function sanitizeString(?string $value, bool $allowHtml = false): ?string
    {
        if ($value === null) {
            return null;
        }

        // Trim whitespace
        $value = trim($value);

        if (empty($value)) {
            return '';
        }

        if (!$allowHtml) {
            // Strip HTML tags and encode special characters
            $value = strip_tags($value);
            // Decode HTML entities to prevent double encoding
            $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            // Re-encode to prevent XSS
            $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);
        }

        // Normalize whitespace (replace multiple spaces/tabs/newlines with single space)
        $value = preg_replace('/\s+/', ' ', $value);

        return trim($value);
    }

    /**
     * Sanitize an email address.
     *
     * @param string|null $value
     * @return string|null
     */
    public function sanitizeEmail(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);
        $value = strtolower($value);
        
        // Remove any HTML tags
        $value = strip_tags($value);
        
        // Remove whitespace
        $value = preg_replace('/\s+/', '', $value);

        return $value ?: null;
    }

    /**
     * Sanitize a phone/mobile number.
     * Removes all non-numeric characters except +, -, spaces, and parentheses.
     *
     * @param string|null $value
     * @return string|null
     */
    public function sanitizePhone(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        // Remove HTML tags
        $value = strip_tags($value);
        
        // Keep only digits, spaces, +, -, (, )
        $value = preg_replace('/[^\d\s\+\-\(\)]/', '', $value);
        
        // Normalize whitespace
        $value = preg_replace('/\s+/', ' ', $value);

        return trim($value) ?: null;
    }

    /**
     * Sanitize a name field.
     * Allows letters, spaces, hyphens, and apostrophes.
     *
     * @param string|null $value
     * @return string|null
     */
    public function sanitizeName(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        // Remove HTML tags
        $value = strip_tags($value);
        
        // Keep only letters, spaces, hyphens, apostrophes, and periods
        $value = preg_replace('/[^a-zA-Z\s\-\'\.]/', '', $value);
        
        // Normalize whitespace
        $value = preg_replace('/\s+/', ' ', $value);

        return trim($value) ?: null;
    }

    /**
     * Sanitize a text area (allows more characters but still removes HTML).
     *
     * @param string|null $value
     * @param bool $allowHtml Whether to allow HTML (default: false)
     * @return string|null
     */
    public function sanitizeText(?string $value, bool $allowHtml = false): ?string
    {
        if ($value === null) {
            return null;
        }

        // Trim whitespace
        $value = trim($value);

        if (empty($value)) {
            return '';
        }

        if (!$allowHtml) {
            // Strip HTML tags
            $value = strip_tags($value);
            // Decode HTML entities
            $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            // Re-encode to prevent XSS
            $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);
        }

        // Normalize line breaks (convert \r\n to \n, then normalize)
        $value = str_replace(["\r\n", "\r"], "\n", $value);
        $value = preg_replace('/\n{3,}/', "\n\n", $value);

        return $value;
    }

    /**
     * Sanitize a URL.
     *
     * @param string|null $value
     * @return string|null
     */
    public function sanitizeUrl(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);
        $value = strip_tags($value);
        
        // Remove whitespace
        $value = preg_replace('/\s+/', '', $value);

        // Validate URL format
        if (!filter_var($value, FILTER_VALIDATE_URL)) {
            return null;
        }

        return $value;
    }

    /**
     * Sanitize an array of values.
     *
     * @param array|null $values
     * @param callable|null $sanitizer Custom sanitizer function
     * @return array|null
     */
    public function sanitizeArray(?array $values, ?callable $sanitizer = null): ?array
    {
        if ($values === null) {
            return null;
        }

        $sanitizer = $sanitizer ?? fn($value) => $this->sanitizeString($value);

        return array_map($sanitizer, $values);
    }

    /**
     * Sanitize all request data.
     *
     * @param array $data
     * @return array
     */
    public function sanitizeRequest(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeArray($value);
            } elseif (is_string($value)) {
                // Auto-detect field type based on key name
                $sanitized[$key] = $this->autoSanitize($key, $value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Auto-sanitize based on field name.
     *
     * @param string $key
     * @param string $value
     * @return string|null
     */
    protected function autoSanitize(string $key, string $value): ?string
    {
        $key = strtolower($key);

        // Email fields
        if (str_contains($key, 'email')) {
            return $this->sanitizeEmail($value);
        }

        // Phone/mobile fields
        if (str_contains($key, 'phone') || str_contains($key, 'mobile')) {
            return $this->sanitizePhone($value);
        }

        // Name fields
        if (str_contains($key, 'name') || str_contains($key, 'fname') || str_contains($key, 'lname')) {
            return $this->sanitizeName($value);
        }

        // URL fields
        if (str_contains($key, 'url') || str_contains($key, 'link')) {
            return $this->sanitizeUrl($value);
        }

        // Message/description fields (allow more characters)
        if (str_contains($key, 'message') || str_contains($key, 'description') || str_contains($key, 'notes')) {
            return $this->sanitizeText($value);
        }

        // Default: sanitize as string
        return $this->sanitizeString($value);
    }
}
