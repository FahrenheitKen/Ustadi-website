<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaystackService
{
    private string $baseUrl = 'https://api.paystack.co';
    private string $secretKey;
    private string $publicKey;

    public function __construct()
    {
        $config = Setting::getPaystackConfig();

        $this->secretKey = $config['secret_key'] ?? '';
        $this->publicKey = $config['public_key'] ?? '';
    }

    /**
     * Initialize a Paystack transaction.
     */
    public function initializeTransaction(string $email, int $amountInKes, string $reference, array $metadata = []): array
    {
        try {
            // Paystack expects amount in the smallest currency unit (cents for KES)
            $amountInCents = $amountInKes * 100;

            $callbackUrl = Setting::get('paystack_callback_url', config('paystack.callback_url'));

            $payload = [
                'email' => $email,
                'amount' => $amountInCents,
                'currency' => 'KES',
                'reference' => $reference,
                'callback_url' => $callbackUrl,
                'metadata' => $metadata,
            ];

            Log::info('Paystack initialize transaction', [
                'email' => $email,
                'amount' => $amountInCents,
                'reference' => $reference,
            ]);

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->secretKey}",
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/transaction/initialize", $payload);

            $data = $response->json();

            Log::info('Paystack initialize response', [
                'status' => $response->status(),
                'body' => $data,
            ]);

            if ($response->successful() && ($data['status'] ?? false)) {
                return [
                    'success' => true,
                    'authorization_url' => $data['data']['authorization_url'],
                    'access_code' => $data['data']['access_code'],
                    'reference' => $data['data']['reference'],
                ];
            }

            return [
                'success' => false,
                'message' => $data['message'] ?? 'Failed to initialize Paystack transaction.',
            ];
        } catch (\Exception $e) {
            Log::error('Paystack initialize exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to process payment request. Please try again.',
            ];
        }
    }

    /**
     * Verify a Paystack transaction by reference.
     */
    public function verifyTransaction(string $reference): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->secretKey}",
            ])->get("{$this->baseUrl}/transaction/verify/{$reference}");

            $data = $response->json();

            Log::info('Paystack verify response', [
                'reference' => $reference,
                'status' => $response->status(),
                'body' => $data,
            ]);

            if ($response->successful() && ($data['status'] ?? false)) {
                $txnData = $data['data'];

                return [
                    'success' => true,
                    'status' => $txnData['status'], // success, failed, abandoned
                    'reference' => $txnData['reference'],
                    'amount' => $txnData['amount'] / 100, // Convert back to KES
                    'currency' => $txnData['currency'],
                    'paid_at' => $txnData['paid_at'] ?? null,
                    'channel' => $txnData['channel'] ?? null,
                    'gateway_response' => $txnData['gateway_response'] ?? null,
                    'metadata' => $txnData['metadata'] ?? [],
                ];
            }

            return [
                'success' => false,
                'message' => $data['message'] ?? 'Failed to verify transaction.',
            ];
        } catch (\Exception $e) {
            Log::error('Paystack verify exception', [
                'message' => $e->getMessage(),
                'reference' => $reference,
            ]);

            return [
                'success' => false,
                'message' => 'Failed to verify transaction status.',
            ];
        }
    }

    /**
     * Validate Paystack webhook signature.
     */
    public function validateWebhookSignature(string $payload, string $signature): bool
    {
        $computed = hash_hmac('sha512', $payload, $this->secretKey);
        return hash_equals($computed, $signature);
    }

    /**
     * Parse webhook event data.
     */
    public function parseWebhookEvent(array $eventData): array
    {
        $event = $eventData['event'] ?? '';
        $data = $eventData['data'] ?? [];

        return [
            'event' => $event,
            'reference' => $data['reference'] ?? null,
            'status' => $data['status'] ?? null,
            'amount' => isset($data['amount']) ? $data['amount'] / 100 : null,
            'currency' => $data['currency'] ?? null,
            'paid_at' => $data['paid_at'] ?? null,
            'channel' => $data['channel'] ?? null,
            'gateway_response' => $data['gateway_response'] ?? null,
            'metadata' => $data['metadata'] ?? [],
        ];
    }

    /**
     * Generate a unique transaction reference.
     */
    public static function generateReference(): string
    {
        return 'UST-' . strtoupper(Str::random(12));
    }

    /**
     * Get the public key for frontend use.
     */
    public function getPublicKey(): string
    {
        return $this->publicKey;
    }

    /**
     * Test the Paystack connection by fetching the balance.
     */
    public function testConnection(): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->secretKey}",
            ])->get("{$this->baseUrl}/balance");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'Paystack connection successful.',
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to connect to Paystack. Please check your credentials.',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Paystack connection failed: ' . $e->getMessage(),
            ];
        }
    }
}
