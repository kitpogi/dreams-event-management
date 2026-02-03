<?php

namespace App\Http\Requests\Portfolio;

use App\Http\Requests\BaseFormRequest;

class StorePortfolioRequest extends BaseFormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'event_date' => ['nullable', 'date'],
            'is_featured' => ['sometimes', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:5120'], // 5MB max
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
            'title.required' => 'Title is required',
            'title.max' => 'Title must not exceed 255 characters',
            'category.max' => 'Category must not exceed 255 characters',
            'event_date.date' => 'Event date must be a valid date',
            'is_featured.boolean' => 'Featured flag must be true or false',
            'display_order.integer' => 'Display order must be a number',
            'display_order.min' => 'Display order must be 0 or greater',
            'image_url.url' => 'Image URL must be a valid URL',
            'image_url.max' => 'Image URL must not exceed 2048 characters',
            'image.image' => 'Uploaded file must be an image',
            'image.mimes' => 'Image must be a JPEG, JPG, PNG, GIF, or WEBP file',
            'image.max' => 'Image size must not exceed 5MB',
        ];
    }
}
