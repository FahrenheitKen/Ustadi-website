<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get all settings.
     */
    public function index(): JsonResponse
    {
        // Non-sensitive settings
        $settings = [
            'site_name' => Setting::get('site_name', 'Ustadi Films'),
            'contact_email' => Setting::get('contact_email', ''),

            // Gateway enable/disable
            'mpesa_enabled' => (bool) Setting::get('mpesa_enabled', false),
            'paystack_enabled' => (bool) Setting::get('paystack_enabled', false),

            // M-Pesa settings
            'mpesa_env' => Setting::get('mpesa_env', config('mpesa.env', 'sandbox')),
            'mpesa_business_short_code' => Setting::get('mpesa_business_short_code', config('mpesa.business_short_code')),
            'mpesa_callback_url' => Setting::get('mpesa_callback_url', config('mpesa.callback_url')),
            // Don't return sensitive values, just indicate if they're set
            'mpesa_consumer_key_set' => !empty(Setting::get('mpesa_consumer_key')),
            'mpesa_consumer_secret_set' => !empty(Setting::get('mpesa_consumer_secret')),
            'mpesa_passkey_set' => !empty(Setting::get('mpesa_passkey')),

            // Paystack settings
            'paystack_callback_url' => Setting::get('paystack_callback_url', config('paystack.callback_url')),
            'paystack_webhook_url' => Setting::get('paystack_webhook_url', config('paystack.webhook_url')),
            'paystack_public_key_set' => !empty(Setting::get('paystack_public_key')),
            'paystack_secret_key_set' => !empty(Setting::get('paystack_secret_key')),
        ];

        return response()->json([
            'success' => true,
            'settings' => $settings,
        ]);
    }

    /**
     * Update settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'site_name' => ['sometimes', 'string', 'max:255'],
            'contact_email' => ['sometimes', 'email', 'max:255'],

            // Gateway toggles
            'mpesa_enabled' => ['sometimes', 'boolean'],
            'paystack_enabled' => ['sometimes', 'boolean'],

            // M-Pesa
            'mpesa_env' => ['sometimes', 'in:sandbox,production'],
            'mpesa_consumer_key' => ['sometimes', 'nullable', 'string'],
            'mpesa_consumer_secret' => ['sometimes', 'nullable', 'string'],
            'mpesa_business_short_code' => ['sometimes', 'nullable', 'string'],
            'mpesa_passkey' => ['sometimes', 'nullable', 'string'],
            'mpesa_callback_url' => ['sometimes', 'nullable', 'url'],

            // Paystack
            'paystack_public_key' => ['sometimes', 'nullable', 'string'],
            'paystack_secret_key' => ['sometimes', 'nullable', 'string'],
            'paystack_callback_url' => ['sometimes', 'nullable', 'url'],
            'paystack_webhook_url' => ['sometimes', 'nullable', 'url'],
        ]);

        foreach ($validated as $key => $value) {
            // For boolean fields, always save (even if false)
            if (in_array($key, ['mpesa_enabled', 'paystack_enabled'])) {
                Setting::set($key, $value ? '1' : '0');
                continue;
            }

            // Only update if value is provided (not null)
            if ($value !== null) {
                Setting::set($key, $value);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
        ]);
    }

    /**
     * Test M-Pesa connection.
     */
    public function testMpesa(): JsonResponse
    {
        try {
            $mpesaService = app(\App\Services\MpesaService::class);
            $token = $mpesaService->getAccessToken();

            if ($token) {
                return response()->json([
                    'success' => true,
                    'message' => 'M-Pesa connection successful. OAuth token obtained.',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to obtain M-Pesa OAuth token. Please check your credentials.',
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'M-Pesa connection failed: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Test Paystack connection.
     */
    public function testPaystack(): JsonResponse
    {
        try {
            $paystackService = app(\App\Services\PaystackService::class);
            $result = $paystackService->testConnection();

            return response()->json($result, $result['success'] ? 200 : 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Paystack connection failed: ' . $e->getMessage(),
            ], 400);
        }
    }
}
