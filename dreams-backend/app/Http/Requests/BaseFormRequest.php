<?php

namespace App\Http\Requests;

use App\Services\InputSanitizerService;
use Illuminate\Foundation\Http\FormRequest;

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
}
