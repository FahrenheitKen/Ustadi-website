<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('film_genre', function (Blueprint $table) {
            $table->foreignUlid('film_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('genre_id')->constrained()->cascadeOnDelete();
            $table->primary(['film_id', 'genre_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('film_genre');
    }
};
