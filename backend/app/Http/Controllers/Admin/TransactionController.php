<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionController extends Controller
{
    /**
     * List all transactions with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['user:id,name,email,phone', 'film:id,title,slug']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', strtoupper($request->status));
        }

        // Filter by date range
        if ($request->has('from')) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->where('created_at', '<=', $request->to);
        }

        // Filter by film
        if ($request->has('film_id')) {
            $query->where('film_id', $request->film_id);
        }

        // Search by user email or phone
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('phone', 'LIKE', "%{$search}%")
                    ->orWhere('mpesa_receipt', 'LIKE', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('email', 'LIKE', "%{$search}%")
                            ->orWhere('name', 'LIKE', "%{$search}%");
                    });
            });
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'transactions' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    /**
     * Get transaction details.
     */
    public function show(Transaction $transaction): JsonResponse
    {
        $transaction->load(['user', 'film', 'rental']);

        return response()->json([
            'success' => true,
            'transaction' => [
                'id' => $transaction->id,
                'user' => $transaction->user ? [
                    'id' => $transaction->user->id,
                    'name' => $transaction->user->name,
                    'email' => $transaction->user->email,
                    'phone' => $transaction->user->phone,
                ] : null,
                'film' => $transaction->film ? [
                    'id' => $transaction->film->id,
                    'title' => $transaction->film->title,
                    'slug' => $transaction->film->slug,
                ] : null,
                'rental' => $transaction->rental ? [
                    'id' => $transaction->rental->id,
                    'status' => $transaction->rental->getStatus(),
                    'first_played' => $transaction->rental->first_played,
                    'access_expires' => $transaction->rental->access_expires,
                ] : null,
                'phone' => $transaction->phone,
                'amount' => $transaction->amount,
                'status' => $transaction->status,
                'mpesa_receipt' => $transaction->mpesa_receipt,
                'checkout_request_id' => $transaction->checkout_request_id,
                'merchant_request_id' => $transaction->merchant_request_id,
                'result_code' => $transaction->result_code,
                'result_desc' => $transaction->result_desc,
                'callback_data' => $transaction->callback_data,
                'created_at' => $transaction->created_at,
                'updated_at' => $transaction->updated_at,
            ],
        ]);
    }

    /**
     * Export transactions to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $query = Transaction::with(['user:id,name,email', 'film:id,title']);

        // Apply same filters as index
        if ($request->has('status')) {
            $query->where('status', strtoupper($request->status));
        }
        if ($request->has('from')) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->where('created_at', '<=', $request->to);
        }

        $transactions = $query->orderBy('created_at', 'desc')->get();

        $callback = function () use ($transactions) {
            $handle = fopen('php://output', 'w');

            // Header row
            fputcsv($handle, [
                'ID',
                'Date',
                'User Name',
                'User Email',
                'Film',
                'Phone',
                'Amount (KES)',
                'Status',
                'M-Pesa Receipt',
                'Result Description',
            ]);

            // Data rows
            foreach ($transactions as $t) {
                fputcsv($handle, [
                    $t->id,
                    $t->created_at->format('Y-m-d H:i:s'),
                    $t->user?->name ?? 'N/A',
                    $t->user?->email ?? 'N/A',
                    $t->film?->title ?? 'N/A',
                    $t->phone,
                    $t->amount,
                    $t->status,
                    $t->mpesa_receipt ?? '',
                    $t->result_desc ?? '',
                ]);
            }

            fclose($handle);
        };

        $filename = 'transactions_' . date('Y-m-d_His') . '.csv';

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
