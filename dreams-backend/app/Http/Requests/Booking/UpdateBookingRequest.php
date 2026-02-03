<?php

namespace App\Http\Requests\Booking;

use App\Http\Requests\BaseFormRequest;
use Carbon\Carbon;

class UpdateBookingRequest extends BaseFormRequest
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
            'event_date' => [
                'sometimes',
                'date',
                'date_format:Y-m-d',
                'after_or_equal:today',
                function ($attribute, $value, $fail) {
                    if ($value) {
                        try {
                            $today = Carbon::now(config('app.timezone'))->startOfDay();
                            $eventDate = Carbon::parse($value, config('app.timezone'))->startOfDay();
                            
                            if ($eventDate->lt($today)) {
                                $fail('The event date must be today or a future date.');
                            }
                            
                            $maxDate = $today->copy()->addYears(2);
                            if ($eventDate->gt($maxDate)) {
                                $fail('The event date cannot be more than 2 years in the future.');
                            }
                        } catch (\Exception $e) {
                            $fail('Invalid date format. Please use YYYY-MM-DD format.');
                        }
                    }
                },
            ],
            'event_time' => [
                'nullable',
                'string',
                'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/',
            ],
            'event_venue' => ['sometimes', 'string', 'max:255'],
            'guest_count' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'number_of_guests' => ['sometimes', 'integer', 'min:1', 'max:10000'],
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
            'event_date.date' => 'Please provide a valid date.',
            'event_date.date_format' => 'Date must be in YYYY-MM-DD format.',
            'event_date.after_or_equal' => 'Event date must be today or in the future.',
            'event_time.regex' => 'Time must be in HH:MM format (24-hour).',
            'guest_count.integer' => 'Number of guests must be a whole number.',
            'guest_count.min' => 'Number of guests must be at least 1.',
            'guest_count.max' => 'Number of guests cannot exceed 10,000.',
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

        // Convert empty string to null for event_time
        if ($this->has('event_time') && $this->event_time === '') {
            $this->merge(['event_time' => null]);
        }
    }
}
