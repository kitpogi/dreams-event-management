<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Custom Validation Messages
    |--------------------------------------------------------------------------
    |
    | Custom user-friendly validation messages for the application.
    | These messages will be shown to users when validation fails.
    |
    */

    // Authentication
    'email' => [
        'required' => 'Please enter your email address.',
        'email' => 'Please enter a valid email address.',
        'unique' => 'This email address is already registered.',
        'exists' => 'We couldn\'t find an account with this email address.',
    ],
    'password' => [
        'required' => 'Please enter your password.',
        'min' => 'Password must be at least :min characters long.',
        'confirmed' => 'Password confirmation does not match.',
        'regex' => 'Password must include uppercase, lowercase, numbers, and special characters.',
    ],
    'name' => [
        'required' => 'Please enter your name.',
        'max' => 'Name cannot exceed :max characters.',
        'string' => 'Name must be text.',
    ],

    // Booking
    'package_id' => [
        'required' => 'Please select a package for your event.',
        'exists' => 'The selected package is not available.',
        'integer' => 'Invalid package selection.',
    ],
    'event_date' => [
        'required' => 'Please select a date for your event.',
        'date' => 'Please enter a valid date.',
        'after' => 'Event date must be in the future.',
        'after_or_equal' => 'Event date must be today or later.',
    ],
    'event_time' => [
        'required' => 'Please select a time for your event.',
        'date_format' => 'Please enter a valid time (e.g., 14:00).',
    ],
    'guest_count' => [
        'required' => 'Please enter the number of guests.',
        'integer' => 'Guest count must be a whole number.',
        'min' => 'Guest count must be at least :min.',
        'max' => 'Guest count cannot exceed :max.',
    ],
    'event_venue' => [
        'required' => 'Please enter the event venue.',
        'string' => 'Venue must be text.',
        'max' => 'Venue name cannot exceed :max characters.',
    ],
    'special_requests' => [
        'string' => 'Special requests must be text.',
        'max' => 'Special requests cannot exceed :max characters.',
    ],

    // Client Information
    'client_fname' => [
        'required' => 'Please enter your first name.',
        'string' => 'First name must be text.',
        'max' => 'First name cannot exceed :max characters.',
    ],
    'client_lname' => [
        'required' => 'Please enter your last name.',
        'string' => 'Last name must be text.',
        'max' => 'Last name cannot exceed :max characters.',
    ],
    'client_email' => [
        'required' => 'Please enter your email address.',
        'email' => 'Please enter a valid email address.',
        'unique' => 'This email address is already registered.',
    ],
    'client_contact' => [
        'required' => 'Please enter your contact number.',
        'string' => 'Contact number must be text.',
        'regex' => 'Please enter a valid Philippine phone number.',
    ],
    'client_address' => [
        'required' => 'Please enter your address.',
        'string' => 'Address must be text.',
        'max' => 'Address cannot exceed :max characters.',
    ],

    // Contact Form
    'subject' => [
        'required' => 'Please enter a subject for your message.',
        'string' => 'Subject must be text.',
        'max' => 'Subject cannot exceed :max characters.',
    ],
    'message' => [
        'required' => 'Please enter your message.',
        'string' => 'Message must be text.',
        'max' => 'Message cannot exceed :max characters.',
        'min' => 'Message must be at least :min characters.',
    ],

    // Review
    'rating' => [
        'required' => 'Please select a rating.',
        'integer' => 'Rating must be a whole number.',
        'min' => 'Rating must be at least :min stars.',
        'max' => 'Rating cannot exceed :max stars.',
        'between' => 'Rating must be between :min and :max stars.',
    ],
    'comment' => [
        'required' => 'Please enter your review.',
        'string' => 'Review must be text.',
        'max' => 'Review cannot exceed :max characters.',
        'min' => 'Review must be at least :min characters.',
    ],

    // Payment
    'amount' => [
        'required' => 'Payment amount is required.',
        'numeric' => 'Amount must be a number.',
        'min' => 'Amount must be at least :min.',
        'max' => 'Amount cannot exceed :max.',
    ],
    'payment_method' => [
        'required' => 'Please select a payment method.',
        'in' => 'Invalid payment method selected.',
    ],

    // File Uploads
    'image' => [
        'required' => 'Please upload an image.',
        'image' => 'File must be an image (JPEG, PNG, GIF, etc.).',
        'mimes' => 'Image must be a :values file.',
        'max' => 'Image size cannot exceed :max KB.',
        'dimensions' => 'Image dimensions are invalid.',
    ],
    'file' => [
        'required' => 'Please upload a file.',
        'mimes' => 'File must be a :values file.',
        'max' => 'File size cannot exceed :max KB.',
    ],

    // Package
    'package_name' => [
        'required' => 'Please enter a package name.',
        'string' => 'Package name must be text.',
        'max' => 'Package name cannot exceed :max characters.',
        'unique' => 'A package with this name already exists.',
    ],
    'package_price' => [
        'required' => 'Please enter a package price.',
        'numeric' => 'Price must be a number.',
        'min' => 'Price must be at least :min.',
    ],
    'package_description' => [
        'string' => 'Description must be text.',
        'max' => 'Description cannot exceed :max characters.',
    ],
    'capacity' => [
        'integer' => 'Capacity must be a whole number.',
        'min' => 'Capacity must be at least :min.',
        'max' => 'Capacity cannot exceed :max.',
    ],

    // Two-Factor Authentication
    'token' => [
        'required' => 'Please enter the verification code.',
        'string' => 'Verification code must be text.',
        'size' => 'Verification code must be exactly :size digits.',
        'digits' => 'Verification code must be :digits digits.',
    ],
    'code' => [
        'required' => 'Please enter the verification code.',
        'string' => 'Verification code must be text.',
    ],

    // API
    'api_key' => [
        'required' => 'API key is required.',
        'string' => 'API key must be text.',
    ],
];
