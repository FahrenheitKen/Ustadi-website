<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Paystack API Credentials
    |--------------------------------------------------------------------------
    */
    'secret_key' => env('PAYSTACK_SECRET_KEY'),
    'public_key' => env('PAYSTACK_PUBLIC_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Callback URL
    |--------------------------------------------------------------------------
    |
    | URL where Paystack redirects the user after payment.
    | This should point to your frontend payment verification page.
    |
    */
    'callback_url' => env('PAYSTACK_CALLBACK_URL'),

    /*
    |--------------------------------------------------------------------------
    | Webhook URL
    |--------------------------------------------------------------------------
    |
    | URL where Paystack sends webhook events.
    | Register this in your Paystack dashboard.
    |
    */
    'webhook_url' => env('PAYSTACK_WEBHOOK_URL'),
];
