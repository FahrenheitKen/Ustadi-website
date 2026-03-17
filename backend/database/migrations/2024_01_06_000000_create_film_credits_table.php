<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('film_credits', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('film_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('person_id')->constrained('people')->cascadeOnDelete();
            $table->string('role'); // e.g., "Director", "Actor", "Producer"
            $table->string('character_name')->nullable(); // For actors
            $table->integer('order')->default(0); // Display order
            $table->timestamps();

            $table->index(['film_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('film_credits');
    }
};
