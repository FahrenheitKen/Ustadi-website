<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('films', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('synopsis');
            $table->string('poster_url')->nullable();
            $table->string('trailer_url')->nullable();
            $table->string('video_url')->nullable(); // S3 path for HLS manifest
            $table->integer('price'); // Price in KES
            $table->integer('duration_mins')->nullable();
            $table->integer('release_year')->nullable();
            $table->string('rating')->nullable(); // e.g., "PG-13", "18+"
            $table->boolean('is_published')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            $table->index('is_published');
            $table->index('is_featured');
            $table->index('release_year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('films');
    }
};
