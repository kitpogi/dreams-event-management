<?php

namespace App\Http\Requests\Contact;

use App\Http\Requests\BaseFormRequest;

class StoreContactRequest extends BaseFormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'], // For backward compatibility
            'first_name' => ['required_without:name', 'string', 'max:255'],
            'last_name' => ['required_without:name', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'mobile_number' => ['nullable', 'string', 'max:20', 'regex:/^[\d\s\-\+\(\)]+$/'],
            'event_type' => [
                'required',
                'string',
                'in:wedding,debut,birthday,pageant,corporate,anniversary,other',
            ],
            'date_of_event' => ['nullable', 'date', 'after_or_equal:today'],
            'preferred_venue' => ['nullable', 'string', 'max:255'],
            'budget' => ['nullable', 'string', 'max:50'], // Changed to string to accept budget range labels
            'estimated_guests' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'message' => ['required', 'string', 'max:2000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'first_name.required_without' => 'First name is required when name is not provided.',
            'last_name.required_without' => 'Last name is required when name is not provided.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please provide a valid email address.',
            'mobile_number.required' => 'Mobile number is required.',
            'mobile_number.regex' => 'Please provide a valid mobile number.',
            'event_type.required' => 'Event type is required.',
            'event_type.in' => 'Please select a valid event type.',
            'date_of_event.date' => 'Please provide a valid date.',
            'date_of_event.after_or_equal' => 'Event date must be today or in the future.',
            'preferred_venue.required' => 'Preferred venue is required.',
            'budget.numeric' => 'Budget must be a number.',
            'budget.min' => 'Budget cannot be negative.',
            'budget.max' => 'Budget cannot exceed 99,999,999.99.',
            'estimated_guests.integer' => 'Estimated guests must be a whole number.',
            'estimated_guests.min' => 'Estimated guests must be at least 1.',
            'estimated_guests.max' => 'Estimated guests cannot exceed 100,000.',
            'message.required' => 'Message is required.',
            'message.max' => 'Message cannot exceed 2000 characters.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Call parent to apply sanitization
        parent::prepareForValidation();

        // Construct name from first_name and last_name if name is not provided
        if (!$this->has('name') && $this->has('first_name') && $this->has('last_name')) {
            $this->merge([
                'name' => trim($this->first_name . ' ' . $this->last_name),
            ]);
        }
    }
}
