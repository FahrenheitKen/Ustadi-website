<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Film extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'title',
        'slug',
        'synopsis',
        'poster_url',
        'trailer_url',
        'video_url',
        'price',
        'duration_mins',
        'release_year',
        'rating',
        'is_published',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'duration_mins' => 'integer',
            'release_year' => 'integer',
            'is_published' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($film) {
            if (empty($film->slug)) {
                $film->slug = Str::slug($film->title);
            }
        });
    }

    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class, 'film_genre');
    }

    public function credits(): HasMany
    {
        return $this->hasMany(FilmCredit::class)->orderBy('order');
    }

    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('is_approved', true);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function getDirector(): ?Person
    {
        $credit = $this->credits()->where('role', 'Director')->first();
        return $credit?->person;
    }

    public function getCast()
    {
        return $this->credits()
            ->where('role', 'Actor')
            ->with('person')
            ->get()
            ->map(fn($credit) => $credit->person);
    }

    public function getAverageRating(): ?float
    {
        $avg = $this->reviews()->avg('rating');
        return $avg ? round($avg, 1) : null;
    }

    public function getRentalCount(): int
    {
        return $this->rentals()->count();
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)->where('is_published', true);
    }
}
