<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Rental extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'user_id',
        'film_id',
        'amount',
        'first_played',
        'access_expires',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'first_played' => 'datetime',
            'access_expires' => 'datetime',
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

    public function transaction(): HasOne
    {
        return $this->hasOne(Transaction::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    /**
     * Check if the rental is still active (has access)
     */
    public function isActive(): bool
    {
        // Not started yet - access is valid
        if ($this->first_played === null) {
            return true;
        }

        // Started - check if access hasn't expired
        return $this->access_expires && $this->access_expires->isFuture();
    }

    /**
     * Mark the rental as started and set the 48-hour expiry
     */
    public function markAsStarted(): void
    {
        if ($this->first_played === null) {
            $this->update([
                'first_played' => now(),
                'access_expires' => now()->addHours(48),
            ]);
        }
    }

    /**
     * Get the status of the rental
     */
    public function getStatus(): string
    {
        if ($this->first_played === null) {
            return 'NOT_STARTED';
        }

        if ($this->access_expires && $this->access_expires->isFuture()) {
            return 'ACTIVE';
        }

        return 'EXPIRED';
    }

    /**
     * Get remaining access time in hours
     */
    public function getRemainingHours(): ?int
    {
        if ($this->first_played === null) {
            return 48; // Full 48 hours available
        }

        if ($this->access_expires && $this->access_expires->isFuture()) {
            return (int) now()->diffInHours($this->access_expires);
        }

        return 0; // Expired
    }
}
