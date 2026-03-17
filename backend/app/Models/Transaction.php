<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory, HasUlids;

    const STATUS_PENDING = 'PENDING';
    const STATUS_SUCCESS = 'SUCCESS';
    const STATUS_FAILED = 'FAILED';
    const STATUS_CANCELLED = 'CANCELLED';

    protected $fillable = [
        'user_id',
        'film_id',
        'rental_id',
        'checkout_request_id',
        'merchant_request_id',
        'phone',
        'amount',
        'status',
        'mpesa_receipt',
        'result_code',
        'result_desc',
        'callback_data',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'result_code' => 'integer',
            'callback_data' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function film(): BelongsTo
    {
        return $this->belongsTo(Film::class);
    }

    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isSuccess(): bool
    {
        return $this->status === self::STATUS_SUCCESS;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function markAsSuccess(array $callbackData): void
    {
        $this->update([
            'status' => self::STATUS_SUCCESS,
            'result_code' => 0,
            'result_desc' => $callbackData['ResultDesc'] ?? 'Success',
            'mpesa_receipt' => $callbackData['MpesaReceiptNumber'] ?? null,
            'callback_data' => $callbackData,
        ]);
    }

    public function markAsFailed(int $resultCode, string $resultDesc, array $callbackData = []): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'result_code' => $resultCode,
            'result_desc' => $resultDesc,
            'callback_data' => $callbackData,
        ]);
    }
}
