<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MpesaService
{
    private string $baseUrl;
    private string $consumerKey;
    private string $consumerSecret;
    private string $businessShortCode;
    private string $passkey;
    private string $callbackUrl;

    public function __construct()
    {
        $config = Setting::getMpesaConfig();

        $this->baseUrl = $config['env'] === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';

        $this->consumerKey = $config['consumer_key'] ?? '';
        $this->consumerSecret = $config['consumer_secret'] ?? '';
        $this->businessShortCode = $config['business_short_code'] ?? '174379';
        $this->passkey = $config['passkey'] ?? '';
        $this->callbackUrl = $config['callback_url'] ?? config('mpesa.callback_url');
    }

    /**
     * Get OAuth access token from Safaricom.
     */
    public function getAccessToken(): ?string
    {
        return Cache::remember('mpesa_access_token', 3000, function () {
            try {
                $credentials = base64_encode("{$this->consumerKey}:{$this->consumerSecret}");

                $response = Http::withHeaders([
                    'Authorization' => "Basic {$credentials}",
                ])->get("{$this->baseUrl}/oauth/v1/generate?grant_type=client_credentials");

                if ($response->successful()) {
                    return $response->json('access_token');
                }

                Log::error('M-Pesa OAuth failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            } catch (\Exception $e) {
                Log::error('M-Pesa OAuth exception', [
                    'message' => $e->getMessage(),
                ]);
                return null;
            }
        });
    }

    /**
     * Initiate STK Push request.
     */
    public function stkPush(string $phone, int $amount, string $accountReference, string $description): array
    {
        $accessToken = $this->getAccessToken();

        if (!$accessToken) {
            return [
                'success' => false,
                'message' => 'Failed to get M-Pesa access token.',
            ];
        }

        // Format phone number
        $phone = $this->formatPhoneNumber($phone);

        if (!$phone) {
            return [
                'success' => false,
                'message' => 'Invalid phone number format.',
            ];
        }

        // Generate timestamp and password
        $timestamp = date('YmdHis');
        $password = base64_encode($this->businessShortCode . $this->passkey . $timestamp);

        $payload = [
            'BusinessShortCode' => $this->businessShortCode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => $amount,
            'PartyA' => $phone,
            'PartyB' => $this->businessShortCode,
            'PhoneNumber' => $phone,
            'CallBackURL' => $this->callbackUrl,
            'AccountReference' => $accountReference,
            'TransactionDesc' => $description,
        ];

        try {
            Log::info('M-Pesa STK Push request', [
                'phone' => $phone,
                'amount' => $amount,
                'account_reference' => $accountReference,
            ]);

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$accessToken}",
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/mpesa/stkpush/v1/processrequest", $payload);

            $data = $response->json();

            Log::info('M-Pesa STK Push response', [
                'status' => $response->status(),
                'body' => $data,
            ]);

            if ($response->successful() && isset($data['ResponseCode']) && $data['ResponseCode'] === '0') {
                return [
                    'success' => true,
                    'checkout_request_id' => $data['CheckoutRequestID'],
                    'merchant_request_id' => $data['MerchantRequestID'],
                    'response_code' => $data['ResponseCode'],
                    'response_description' => $data['ResponseDescription'] ?? 'Success',
                    'customer_message' => $data['CustomerMessage'] ?? 'Check your phone and enter M-Pesa PIN',
                ];
            }

            return [
                'success' => false,
                'message' => $data['errorMessage'] ?? $data['ResponseDescription'] ?? 'STK Push request failed.',
                'response_code' => $data['ResponseCode'] ?? null,
            ];

        } catch (\Exception $e) {
            Log::error('M-Pesa STK Push exception', [
                'message' => $e->getMessage(),
                'phone' => $phone,
            ]);

            return [
                'success' => false,
                'message' => 'Failed to process payment request. Please try again.',
            ];
        }
    }

    /**
     * Query STK Push transaction status.
     */
    public function queryStatus(string $checkoutRequestId): array
    {
        $accessToken = $this->getAccessToken();

        if (!$accessToken) {
            return [
                'success' => false,
                'message' => 'Failed to get M-Pesa access token.',
            ];
        }

        $timestamp = date('YmdHis');
        $password = base64_encode($this->businessShortCode . $this->passkey . $timestamp);

        $payload = [
            'BusinessShortCode' => $this->businessShortCode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'CheckoutRequestID' => $checkoutRequestId,
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$accessToken}",
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/mpesa/stkpushquery/v1/query", $payload);

            return $response->json();
        } catch (\Exception $e) {
            Log::error('M-Pesa status query exception', [
                'message' => $e->getMessage(),
                'checkout_request_id' => $checkoutRequestId,
            ]);

            return [
                'success' => false,
                'message' => 'Failed to query transaction status.',
            ];
        }
    }

    /**
     * Parse callback data from Safaricom.
     */
    public function parseCallback(array $callbackData): array
    {
        $stkCallback = $callbackData['Body']['stkCallback'] ?? null;

        if (!$stkCallback) {
            return [
                'success' => false,
                'message' => 'Invalid callback data.',
            ];
        }

        $resultCode = $stkCallback['ResultCode'];
        $resultDesc = $stkCallback['ResultDesc'];
        $merchantRequestId = $stkCallback['MerchantRequestID'];
        $checkoutRequestId = $stkCallback['CheckoutRequestID'];

        $result = [
            'result_code' => $resultCode,
            'result_desc' => $resultDesc,
            'merchant_request_id' => $merchantRequestId,
            'checkout_request_id' => $checkoutRequestId,
            'success' => $resultCode === 0,
        ];

        // Extract metadata on success
        if ($resultCode === 0 && isset($stkCallback['CallbackMetadata'])) {
            $metadata = $stkCallback['CallbackMetadata']['Item'];

            foreach ($metadata as $item) {
                switch ($item['Name']) {
                    case 'Amount':
                        $result['amount'] = $item['Value'];
                        break;
                    case 'MpesaReceiptNumber':
                        $result['mpesa_receipt'] = $item['Value'];
                        break;
                    case 'TransactionDate':
                        $result['transaction_date'] = $item['Value'];
                        break;
                    case 'PhoneNumber':
                        $result['phone_number'] = $item['Value'];
                        break;
                }
            }
        }

        return $result;
    }

    /**
     * Format phone number to Safaricom format (254...).
     */
    public function formatPhoneNumber(string $phone): ?string
    {
        // Remove any spaces, dashes, or special characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Handle different formats
        if (strlen($phone) === 9 && ($phone[0] === '7' || $phone[0] === '1')) {
            // 7XXXXXXXX or 1XXXXXXXX format
            return '254' . $phone;
        }

        if (strlen($phone) === 10 && $phone[0] === '0') {
            // 07XXXXXXXX or 01XXXXXXXX format
            return '254' . substr($phone, 1);
        }

        if (strlen($phone) === 12 && substr($phone, 0, 3) === '254') {
            // Already in correct format
            return $phone;
        }

        if (strlen($phone) === 13 && $phone[0] === '+' && substr($phone, 1, 3) === '254') {
            // +254XXXXXXXXX format
            return substr($phone, 1);
        }

        // Invalid format
        return null;
    }

    /**
     * Validate if a phone number is a valid Kenyan mobile number.
     */
    public function isValidPhoneNumber(string $phone): bool
    {
        $formatted = $this->formatPhoneNumber($phone);

        if (!$formatted) {
            return false;
        }

        // Check if it's a valid Safaricom, Airtel, or Telkom number
        // Safaricom: 254 7XX XXX XXX or 254 11X XXX XXX
        // Airtel: 254 73X XXX XXX or 254 78X XXX XXX
        // Telkom: 254 77X XXX XXX
        $prefix = substr($formatted, 3, 2);

        $validPrefixes = ['70', '71', '72', '74', '75', '76', '79', '10', '11', '73', '78', '77'];

        return in_array($prefix, $validPrefixes);
    }
}
