<?php

namespace App\Http\Requests\Package;

use App\Http\Requests\BaseFormRequest;

class StorePackageRequest extends BaseFormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'package_name' => ['required', 'string', 'max:255'],
            'package_description' => ['required', 'string'],
            'package_category' => ['required', 'string', 'max:255'],
            'package_price' => [
                'required',
                'numeric',
                'min:0.01',
                'max:99999999.99',
                'regex:/^\d+(\.\d{1,2})?$/',
            ],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'venue_id' => ['nullable', 'exists:venues,id'],
            'package_image' => [
                'nullable',
                'image',
                'mimes:jpeg,png,jpg,gif,webp',
                'max:2048', // 2MB
            ],
            'package_inclusions' => ['required', 'string'],
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
            'package_name.required' => 'Package name is required.',
            'package_name.max' => 'Package name cannot exceed 255 characters.',
            'package_description.required' => 'Package description is required.',
            'package_category.required' => 'Package category is required.',
            'package_price.required' => 'Package price is required.',
            'package_price.numeric' => 'Package price must be a number.',
            'package_price.min' => 'Package price must be at least 0.01.',
            'package_price.max' => 'Package price cannot exceed 99,999,999.99.',
            'package_price.regex' => 'Package price can have at most 2 decimal places.',
            'capacity.integer' => 'Capacity must be a whole number.',
            'capacity.min' => 'Capacity must be at least 1.',
            'capacity.max' => 'Capacity cannot exceed 100,000.',
            'venue_id.exists' => 'The selected venue does not exist.',
            'package_image.image' => 'The file must be an image.',
            'package_image.mimes' => 'The image must be a file of type: jpeg, png, jpg, gif, webp.',
            'package_image.max' => 'The image may not be greater than 2MB.',
            'package_inclusions.required' => 'Package inclusions are required.',
        ];
    }
}
