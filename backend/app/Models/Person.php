<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Person extends Model
{
    use HasFactory, HasUlids;

    protected $table = 'people';

    protected $fillable = [
        'name',
        'photo_url',
        'bio',
    ];

    public function credits(): HasMany
    {
        return $this->hasMany(FilmCredit::class);
    }

    public function films()
    {
        return $this->credits()->with('film')->get()->pluck('film')->unique('id');
    }
}
