<?php

namespace App\Http\Requests\Testimonial;

use App\Http\Requests\BaseFormRequest;

class UpdateTestimonialRequest extends BaseFormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled via middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'client_name' => ['sometimes', 'string', 'max:255'],
            'client_initials' => ['nullable', 'string', 'max:10'],
            'event_type' => ['nullable', 'string', 'max:255'],
            'event_date' => ['nullable', 'date'],
            'rating' => ['sometimes', 'integer', 'min:1', 'max:5'],
            'message' => ['sometimes', 'string'],
            'is_featured' => ['sometimes', 'boolean'],
            'avatar_url' => ['nullable', 'url', 'max:2048'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:4096'], // 4MB max
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
            'client_name.max' => 'Client name must not exceed 255 characters',
            'client_initials.max' => 'Client initials must not exceed 10 characters',
            'event_type.max' => 'Event type must not exceed 255 characters',
            'event_date.date' => 'Event date must be a valid date',
            'rating.integer' => 'Rating must be a number',
            'rating.min' => 'Rating must be at least 1',
            'rating.max' => 'Rating must be at most 5',
            'is_featured.boolean' => 'Featured flag must be true or false',
            'avatar_url.url' => 'Avatar URL must be a valid URL',
            'avatar_url.max' => 'Avatar URL must not exceed 2048 characters',
            'avatar.image' => 'Uploaded file must be an image',
            'avatar.mimes' => 'Avatar must be a JPEG, JPG, PNG, GIF, or WEBP file',
            'avatar.max' => 'Avatar size must not exceed 4MB',
        ];
    }
}
