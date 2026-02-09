<?php

namespace App\Http\Requests\Booking;

use App\Http\Requests\BaseFormRequest;
use Carbon\Carbon;

class StoreBookingRequest extends BaseFormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled in controller
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'package_id' => ['required', 'exists:event_packages,package_id'],
            'event_date' => [
                'required',
                'date',
                'date_format:Y-m-d',
                'after_or_equal:today',
                function ($attribute, $value, $fail) {
                    try {
                        $today = Carbon::now(config('app.timezone'))->startOfDay();
                        $eventDate = Carbon::parse($value, config('app.timezone'))->startOfDay();

                        if ($eventDate->lt($today)) {
                            $fail('The event date must be a future date.');
                        }

                        $maxDate = $today->copy()->addYears(2);
                        if ($eventDate->gt($maxDate)) {
                            $fail('The event date cannot be more than 2 years in the future.');
                        }
                    } catch (\Exception $e) {
                        $fail('Invalid date format. Please use YYYY-MM-DD format.');
                    }
                },
            ],
            'event_venue' => ['nullable', 'string', 'max:255'],
            'event_time' => [
                'nullable',
                'string',
                'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/',
            ],
            'event_duration' => [
                'nullable',
                'numeric',
                'min:0.5',
                'max:24',
            ],
            'event_end_time' => [
                'nullable',
                'string',
                'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/',
            ],
            'guest_count' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'number_of_guests' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'special_requests' => ['nullable', 'string'],
            'event_type' => ['nullable', 'string', 'max:100'],
            'theme' => ['nullable', 'string', 'max:100'],
            'budget_range' => ['nullable', 'string', 'max:100'],
            'alternate_contact' => ['nullable', 'string', 'max:100'],
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
            'package_id.required' => 'Please select a package.',
            'package_id.exists' => 'The selected package does not exist.',
            'event_date.required' => 'Event date is required.',
            'event_date.date' => 'Please provide a valid date.',
            'event_date.date_format' => 'Date must be in YYYY-MM-DD format.',
            'event_date.after_or_equal' => 'Event date must be today or in the future.',
            'event_time.regex' => 'Time must be in HH:MM format (24-hour).',
            'guest_count.integer' => 'Number of guests must be a whole number.',
            'guest_count.min' => 'Number of guests must be at least 1.',
            'guest_count.max' => 'Number of guests cannot exceed 10,000.',
            'number_of_guests.integer' => 'Number of guests must be a whole number.',
            'number_of_guests.min' => 'Number of guests must be at least 1.',
            'number_of_guests.max' => 'Number of guests cannot exceed 10,000.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Normalize guest_count and number_of_guests
        if ($this->has('number_of_guests') && !$this->has('guest_count')) {
            $this->merge([
                'guest_count' => $this->number_of_guests,
            ]);
        }

        // Convert potential empty strings to null for nullable fields
        if ($this->event_time === '') {
            $this->merge(['event_time' => null]);
        }
        if ($this->event_duration === '') {
            $this->merge(['event_duration' => null]);
        }
        if ($this->event_end_time === '') {
            $this->merge(['event_end_time' => null]);
        }
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        \Illuminate\Support\Facades\Log::warning('Booking validation failed', [
            'errors' => $validator->errors()->toArray(),
            'input' => $this->all()
        ]);

        parent::failedValidation($validator);
    }
}
