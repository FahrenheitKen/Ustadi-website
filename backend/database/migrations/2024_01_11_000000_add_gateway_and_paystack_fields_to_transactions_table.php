<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('gateway', 20)->default('mpesa')->after('film_id'); // mpesa, paystack
            $table->string('paystack_reference')->nullable()->after('merchant_request_id');
            $table->string('paystack_access_code')->nullable()->after('paystack_reference');

            $table->index('paystack_reference');
            $table->index('gateway');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['paystack_reference']);
            $table->dropIndex(['gateway']);
            $table->dropColumn(['gateway', 'paystack_reference', 'paystack_access_code']);
        });
    }
};
