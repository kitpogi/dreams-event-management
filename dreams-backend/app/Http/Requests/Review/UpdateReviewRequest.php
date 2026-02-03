<?php

namespace App\Http\Requests\Review;

use App\Http\Requests\BaseFormRequest;

class UpdateReviewRequest extends BaseFormRequest
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
            'rating' => ['sometimes', 'integer', 'min:1', 'max:5'],
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
            'rating.integer' => 'Rating must be a number',
            'rating.min' => 'Rating must be at least 1',
            'rating.max' => 'Rating must be at most 5',
            'review_message.max' => 'Review message must not exceed 1000 characters',
        ];
    }
}
