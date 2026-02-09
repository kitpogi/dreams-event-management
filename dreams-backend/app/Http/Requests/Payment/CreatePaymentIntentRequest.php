<?php

namespace App\Http\Requests\Payment;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class CreatePaymentIntentRequest extends BaseFormRequest
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
            'booking_id' => ['required', 'integer', 'exists:booking_details,booking_id'],
            'amount' => [
                'required',
                'numeric',
                'min:0.01',
                'max:99999999.99',
                function ($attribute, $value, $fail) {
                    // Ensure exactly 2 decimal places for currency
                    if (preg_match('/\.\d{3,}/', (string)$value)) {
                        $fail('The amount must have at most 2 decimal places.');
                    }
                    // Ensure positive value
                    if ($value <= 0) {
                        $fail('The amount must be greater than 0.');
                    }
                },
            ],
            'payment_methods' => ['sometimes', 'array'],
            'payment_methods.*' => ['string', Rule::in(['card', 'gcash', 'paymaya', 'grab_pay', 'dob', 'billease'])],
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
            'booking_id.required' => 'Booking ID is required',
            'booking_id.exists' => 'The selected booking does not exist',
            'amount.required' => 'Payment amount is required',
            'amount.numeric' => 'Amount must be a valid number',
            'amount.min' => 'Amount must be at least 0.01',
            'amount.max' => 'Amount exceeds the maximum allowed',
            'payment_methods.array' => 'Payment methods must be an array',
            'payment_methods.*.in' => 'Invalid payment method selected',
        ];
    }
}
