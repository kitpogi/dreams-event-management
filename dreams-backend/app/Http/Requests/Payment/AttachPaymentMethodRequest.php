<?php

namespace App\Http\Requests\Payment;

use App\Http\Requests\BaseFormRequest;

class AttachPaymentMethodRequest extends BaseFormRequest
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
            'payment_intent_id' => ['required', 'string'],
            'payment_method_id' => ['required', 'string'],
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
            'payment_intent_id.required' => 'Payment intent ID is required',
            'payment_method_id.required' => 'Payment method ID is required',
        ];
    }
}
