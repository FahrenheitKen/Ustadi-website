<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('film_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('rental_id')->constrained()->cascadeOnDelete();
            $table->integer('rating'); // 1-5 stars
            $table->string('title')->nullable(); // Optional review headline
            $table->text('content')->nullable(); // Optional review body
            $table->boolean('is_approved')->default(true); // Can hide spam
            $table->timestamps();

            $table->unique(['user_id', 'film_id']); // One review per film per user
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
