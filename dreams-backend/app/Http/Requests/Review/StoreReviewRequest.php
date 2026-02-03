<?php

namespace App\Http\Requests\Review;

use App\Http\Requests\BaseFormRequest;

class StoreReviewRequest extends BaseFormRequest
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
            'package_id' => ['required', 'integer', 'exists:event_packages,package_id'],
            'booking_id' => ['required', 'integer', 'exists:booking_details,booking_id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'review_message' => ['nullable', 'string', 'max:1000'],
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
            'package_id.required' => 'Package ID is required',
            'package_id.exists' => 'The selected package does not exist',
            'booking_id.required' => 'Booking ID is required',
            'booking_id.exists' => 'The selected booking does not exist',
            'rating.required' => 'Rating is required',
            'rating.integer' => 'Rating must be a number',
            'rating.min' => 'Rating must be at least 1',
            'rating.max' => 'Rating must be at most 5',
            'review_message.max' => 'Review message must not exceed 1000 characters',
        ];
    }
}
