<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('film_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('rental_id')->nullable()->constrained()->nullOnDelete();
            $table->string('checkout_request_id')->nullable(); // From Mpesa STK Push response
            $table->string('merchant_request_id')->nullable(); // From Mpesa STK Push response
            $table->string('phone'); // Phone number used
            $table->integer('amount'); // Amount in KES
            $table->enum('status', ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'])->default('PENDING');
            $table->string('mpesa_receipt')->nullable(); // Set on successful callback
            $table->integer('result_code')->nullable(); // Mpesa result code
            $table->string('result_desc')->nullable(); // Mpesa result description
            $table->json('callback_data')->nullable(); // Full callback payload for debugging
            $table->timestamps();

            $table->index('checkout_request_id');
            $table->index('status');
            $table->index(['user_id', 'film_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
