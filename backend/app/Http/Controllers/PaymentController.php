<?php

namespace App\Http\Controllers;

use App\Models\Film;
use App\Models\Rental;
use App\Models\Setting;
use App\Models\Transaction;
use App\Services\MpesaService;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(
        private MpesaService $mpesaService,
        private PaystackService $paystackService
    ) {}

    /**
     * Get enabled payment gateways and their public config.
     */
    public function gateways(): JsonResponse
    {
        $gateways = [];

        if (Setting::isGatewayEnabled('mpesa')) {
            $gateways[] = [
                'id' => 'mpesa',
                'name' => 'M-Pesa',
                'description' => 'Pay with M-Pesa mobile money',
            ];
        }

        if (Setting::isGatewayEnabled('paystack')) {
            $gateways[] = [
                'id' => 'paystack',
                'name' => 'Paystack',
                'description' => 'Pay with card, bank transfer, or mobile money',
                'public_key' => $this->paystackService->getPublicKey(),
            ];
        }

        return response()->json([
            'success' => true,
            'gateways' => $gateways,
        ]);
    }

    /**
     * Initiate M-Pesa STK Push payment.
     */
    public function initiate(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'film_id' => ['required', 'exists:films,id'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email'],
            'phone' => ['required', 'string'],
        ]);

        // Check if M-Pesa is enabled
        if (!Setting::isGatewayEnabled('mpesa')) {
            return response()->json([
                'success' => false,
                'message' => 'M-Pesa payments are currently disabled.',
            ], 400);
        }

        // Get the film
        $film = Film::published()->findOrFail($validated['film_id']);

        // Check if user already has active rental
        if ($user->hasActiveRental($film->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active rental for this film.',
            ], 422);
        }

        // Validate phone number
        $formattedPhone = $this->mpesaService->formatPhoneNumber($validated['phone']);

        if (!$formattedPhone || !$this->mpesaService->isValidPhoneNumber($validated['phone'])) {
            return response()->json([
                'success' => false,
                'message' => 'Please enter a valid Kenyan phone number.',
                'errors' => [
                    'phone' => ['Invalid phone number format.'],
                ],
            ], 422);
        }

        // Check for pending transaction
        $pendingTransaction = Transaction::where('user_id', $user->id)
            ->where('film_id', $film->id)
            ->where('gateway', Transaction::GATEWAY_MPESA)
            ->where('status', Transaction::STATUS_PENDING)
            ->where('created_at', '>', now()->subMinutes(2))
            ->first();

        if ($pendingTransaction) {
            return response()->json([
                'success' => false,
                'message' => 'You have a pending payment. Please check your phone for the STK push prompt.',
                'transaction_id' => $pendingTransaction->id,
            ], 422);
        }

        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'film_id' => $film->id,
            'gateway' => Transaction::GATEWAY_MPESA,
            'phone' => $formattedPhone,
            'amount' => $film->price,
            'status' => Transaction::STATUS_PENDING,
        ]);

        // Build account reference (max 12 chars)
        $accountRef = 'UST-' . substr($film->slug, 0, 8);

        // Initiate STK Push
        $result = $this->mpesaService->stkPush(
            phone: $formattedPhone,
            amount: $film->price,
            accountReference: $accountRef,
            description: "Film rental: {$film->title}"
        );

        if (!$result['success']) {
            $transaction->update([
                'status' => Transaction::STATUS_FAILED,
                'result_desc' => $result['message'],
            ]);

            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 400);
        }

        // Update transaction with M-Pesa request IDs
        $transaction->update([
            'checkout_request_id' => $result['checkout_request_id'],
            'merchant_request_id' => $result['merchant_request_id'],
        ]);

        return response()->json([
            'success' => true,
            'message' => $result['customer_message'] ?? 'Check your phone and enter M-Pesa PIN',
            'transaction_id' => $transaction->id,
            'checkout_request_id' => $result['checkout_request_id'],
        ]);
    }

    /**
     * Initiate Paystack payment.
     */
    public function initiatePaystack(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'film_id' => ['required', 'exists:films,id'],
            'email' => ['required', 'email'],
        ]);

        // Check if Paystack is enabled
        if (!Setting::isGatewayEnabled('paystack')) {
            return response()->json([
                'success' => false,
                'message' => 'Paystack payments are currently disabled.',
            ], 400);
        }

        // Get the film
        $film = Film::published()->findOrFail($validated['film_id']);

        // Check if user already has active rental
        if ($user->hasActiveRental($film->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active rental for this film.',
            ], 422);
        }

        // Check for pending Paystack transaction
        $pendingTransaction = Transaction::where('user_id', $user->id)
            ->where('film_id', $film->id)
            ->where('gateway', Transaction::GATEWAY_PAYSTACK)
            ->where('status', Transaction::STATUS_PENDING)
            ->where('created_at', '>', now()->subMinutes(2))
            ->first();

        if ($pendingTransaction) {
            return response()->json([
                'success' => false,
                'message' => 'You have a pending Paystack payment. Please complete it or wait a few minutes.',
                'transaction_id' => $pendingTransaction->id,
            ], 422);
        }

        // Generate reference
        $reference = PaystackService::generateReference();

        // Create transaction record
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'film_id' => $film->id,
            'gateway' => Transaction::GATEWAY_PAYSTACK,
            'paystack_reference' => $reference,
            'phone' => $user->phone ?? '',
            'amount' => $film->price,
            'status' => Transaction::STATUS_PENDING,
        ]);

        // Return details for frontend to open Paystack popup via newTransaction()
        return response()->json([
            'success' => true,
            'message' => 'Payment initialized. Complete payment on Paystack.',
            'transaction_id' => $transaction->id,
            'reference' => $reference,
            'public_key' => $this->paystackService->getPublicKey(),
            'amount' => $film->price * 100, // Paystack expects amount in lowest currency unit (cents)
            'email' => $validated['email'],
        ]);
    }

    /**
     * Verify Paystack payment (called by frontend after popup closes).
     */
    public function verifyPaystack(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference' => ['required', 'string'],
        ]);

        $transaction = Transaction::where('paystack_reference', $validated['reference'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found.',
            ], 404);
        }

        // Already processed
        if ($transaction->status !== Transaction::STATUS_PENDING) {
            return response()->json([
                'success' => true,
                'status' => $transaction->status,
                'message' => $this->getStatusMessage($transaction),
                'rental_id' => $transaction->rental_id,
            ]);
        }

        // Verify with Paystack
        $result = $this->paystackService->verifyTransaction($validated['reference']);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 400);
        }

        if ($result['status'] === 'success') {
            $this->processPaystackSuccess($transaction, $result);
        } else {
            $transaction->update([
                'status' => Transaction::STATUS_FAILED,
                'result_desc' => $result['gateway_response'] ?? 'Payment was not completed.',
                'callback_data' => $result,
            ]);
        }

        // Reload transaction
        $transaction->refresh();

        return response()->json([
            'success' => true,
            'status' => $transaction->status,
            'message' => $this->getStatusMessage($transaction),
            'rental_id' => $transaction->rental_id,
        ]);
    }

    /**
     * Handle Paystack webhook.
     */
    public function paystackWebhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->header('x-paystack-signature', '');

        Log::info('Paystack webhook received', [
            'ip' => $request->ip(),
        ]);

        // Validate signature
        if (!$this->paystackService->validateWebhookSignature($payload, $signature)) {
            Log::warning('Paystack webhook: invalid signature', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['status' => 'invalid signature'], 400);
        }

        $eventData = $request->all();
        $parsed = $this->paystackService->parseWebhookEvent($eventData);

        Log::info('Paystack webhook event', [
            'event' => $parsed['event'],
            'reference' => $parsed['reference'],
        ]);

        // Only handle charge.success events
        if ($parsed['event'] !== 'charge.success') {
            return response()->json(['status' => 'ok']);
        }

        if (!$parsed['reference']) {
            Log::error('Paystack webhook: missing reference');
            return response()->json(['status' => 'ok']);
        }

        // Find the transaction
        $transaction = Transaction::where('paystack_reference', $parsed['reference'])->first();

        if (!$transaction) {
            Log::error('Paystack webhook: Transaction not found', [
                'reference' => $parsed['reference'],
            ]);
            return response()->json(['status' => 'ok']);
        }

        // Check if already processed (idempotency)
        if ($transaction->status !== Transaction::STATUS_PENDING) {
            Log::info('Paystack webhook: Transaction already processed', [
                'transaction_id' => $transaction->id,
                'status' => $transaction->status,
            ]);
            return response()->json(['status' => 'ok']);
        }

        // Verify the transaction with Paystack API for extra security
        $verification = $this->paystackService->verifyTransaction($parsed['reference']);

        if ($verification['success'] && $verification['status'] === 'success') {
            $this->processPaystackSuccess($transaction, $verification);
        } else {
            $transaction->update([
                'status' => Transaction::STATUS_FAILED,
                'result_desc' => $verification['gateway_response'] ?? 'Verification failed.',
                'callback_data' => $verification,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Handle M-Pesa callback from Safaricom.
     */
    public function callback(Request $request): JsonResponse
    {
        $callbackData = $request->all();

        Log::info('M-Pesa callback received', [
            'ip' => $request->ip(),
            'data' => $callbackData,
        ]);

        // Parse the callback
        $parsed = $this->mpesaService->parseCallback($callbackData);

        if (!isset($parsed['checkout_request_id'])) {
            Log::error('M-Pesa callback missing checkout_request_id', $callbackData);
            return response()->json([
                'ResultCode' => 0,
                'ResultDesc' => 'Accepted',
            ]);
        }

        // Find the transaction
        $transaction = Transaction::where('checkout_request_id', $parsed['checkout_request_id'])->first();

        if (!$transaction) {
            Log::error('M-Pesa callback: Transaction not found', [
                'checkout_request_id' => $parsed['checkout_request_id'],
            ]);
            return response()->json([
                'ResultCode' => 0,
                'ResultDesc' => 'Accepted',
            ]);
        }

        // Check if already processed (idempotency)
        if ($transaction->status !== Transaction::STATUS_PENDING) {
            Log::info('M-Pesa callback: Transaction already processed', [
                'transaction_id' => $transaction->id,
                'status' => $transaction->status,
            ]);
            return response()->json([
                'ResultCode' => 0,
                'ResultDesc' => 'Accepted',
            ]);
        }

        // Process based on result
        if ($parsed['success']) {
            // Successful payment
            DB::transaction(function () use ($transaction, $parsed) {
                // Create rental
                $rental = Rental::create([
                    'user_id' => $transaction->user_id,
                    'film_id' => $transaction->film_id,
                    'amount' => $transaction->amount,
                ]);

                // Update transaction
                $transaction->update([
                    'status' => Transaction::STATUS_SUCCESS,
                    'rental_id' => $rental->id,
                    'mpesa_receipt' => $parsed['mpesa_receipt'] ?? null,
                    'result_code' => $parsed['result_code'],
                    'result_desc' => $parsed['result_desc'],
                    'callback_data' => $parsed,
                ]);

                Log::info('M-Pesa payment successful', [
                    'transaction_id' => $transaction->id,
                    'rental_id' => $rental->id,
                    'mpesa_receipt' => $parsed['mpesa_receipt'] ?? null,
                ]);
            });
        } else {
            // Failed payment
            $transaction->update([
                'status' => Transaction::STATUS_FAILED,
                'result_code' => $parsed['result_code'],
                'result_desc' => $parsed['result_desc'],
                'callback_data' => $parsed,
            ]);

            Log::info('M-Pesa payment failed', [
                'transaction_id' => $transaction->id,
                'result_code' => $parsed['result_code'],
                'result_desc' => $parsed['result_desc'],
            ]);
        }

        // Always respond with success to Safaricom
        return response()->json([
            'ResultCode' => 0,
            'ResultDesc' => 'Accepted',
        ]);
    }

    /**
     * Poll transaction status.
     */
    public function status(Request $request, Transaction $transaction): JsonResponse
    {
        $user = $request->user();

        // Verify transaction belongs to user
        if ($transaction->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $response = [
            'success' => true,
            'status' => $transaction->status,
            'gateway' => $transaction->gateway,
            'message' => $this->getStatusMessage($transaction),
        ];

        if ($transaction->isSuccess()) {
            $response['rental_id'] = $transaction->rental_id;
        }

        if ($transaction->isFailed()) {
            $response['error'] = $transaction->result_desc;
        }

        return response()->json($response);
    }

    /**
     * Process a successful Paystack payment.
     */
    private function processPaystackSuccess(Transaction $transaction, array $result): void
    {
        DB::transaction(function () use ($transaction, $result) {
            // Create rental
            $rental = Rental::create([
                'user_id' => $transaction->user_id,
                'film_id' => $transaction->film_id,
                'amount' => $transaction->amount,
            ]);

            // Update transaction
            $transaction->update([
                'status' => Transaction::STATUS_SUCCESS,
                'rental_id' => $rental->id,
                'result_code' => 0,
                'result_desc' => $result['gateway_response'] ?? 'Payment successful',
                'callback_data' => $result,
            ]);

            Log::info('Paystack payment successful', [
                'transaction_id' => $transaction->id,
                'rental_id' => $rental->id,
                'reference' => $transaction->paystack_reference,
            ]);
        });
    }

    /**
     * Get user-friendly status message.
     */
    private function getStatusMessage(Transaction $transaction): string
    {
        return match ($transaction->status) {
            Transaction::STATUS_PENDING => 'Waiting for payment confirmation...',
            Transaction::STATUS_SUCCESS => 'Payment successful! You can now watch the film.',
            Transaction::STATUS_FAILED => $this->getFailureMessage($transaction),
            Transaction::STATUS_CANCELLED => 'Payment was cancelled.',
            default => 'Unknown status.',
        };
    }

    /**
     * Get user-friendly failure message.
     */
    private function getFailureMessage(Transaction $transaction): string
    {
        if ($transaction->gateway === Transaction::GATEWAY_MPESA) {
            return match ($transaction->result_code) {
                1 => 'Insufficient M-Pesa balance.',
                1032 => 'Payment was cancelled.',
                1037 => 'Transaction timed out. Please try again.',
                2001 => 'Wrong M-Pesa PIN entered.',
                default => $transaction->result_desc ?? 'Payment failed. Please try again.',
            };
        }

        return $transaction->result_desc ?? 'Payment failed. Please try again.';
    }
}
