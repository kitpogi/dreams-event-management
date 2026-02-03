<?php

namespace App\Http\Requests\Venue;

use App\Http\Requests\BaseFormRequest;

class StoreVenueRequest extends BaseFormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'capacity' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
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
            'name.required' => 'Venue name is required',
            'name.max' => 'Venue name must not exceed 255 characters',
            'location.required' => 'Venue location is required',
            'location.max' => 'Location must not exceed 255 characters',
            'capacity.required' => 'Capacity is required',
            'capacity.integer' => 'Capacity must be a number',
            'capacity.min' => 'Capacity must be at least 1',
        ];
    }
}
