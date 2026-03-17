<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rentals', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('film_id')->constrained()->cascadeOnDelete();
            $table->integer('amount'); // Amount paid in KES
            $table->timestamp('first_played')->nullable(); // When user first started watching
            $table->timestamp('access_expires')->nullable(); // 48 hours from first_played
            $table->timestamps();

            $table->index(['user_id', 'film_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rentals');
    }
};
