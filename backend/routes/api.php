<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\SocialiteController;
use App\Http\Controllers\FilmController;
use App\Http\Controllers\GenreController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\RentalController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VideoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

// Films
Route::get('/films', [FilmController::class, 'index']);
Route::get('/films/featured', [FilmController::class, 'featured']);
Route::get('/films/new-releases', [FilmController::class, 'newReleases']);
Route::get('/films/popular', [FilmController::class, 'popular']);
Route::get('/films/{slug}', [FilmController::class, 'show']);

// Genres
Route::get('/genres', [GenreController::class, 'index']);
Route::get('/genres/{slug}', [GenreController::class, 'show']);

// Reviews (public read)
Route::get('/reviews/{filmId}', [ReviewController::class, 'index']);

// Trailers (public)
Route::get('/videos/trailer/{filmId}', [VideoController::class, 'getTrailerUrl']);

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisterController::class, 'register']);
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/forgot-password', [PasswordController::class, 'forgot']);
    Route::post('/reset-password', [PasswordController::class, 'reset']);

    // Google OAuth
    Route::get('/google', [SocialiteController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [SocialiteController::class, 'handleGoogleCallback']);
});

/*
|--------------------------------------------------------------------------
| Protected Routes (Auth Required)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [LoginController::class, 'logout']);

    // User Profile
    Route::get('/user', [UserController::class, 'me']);
    Route::patch('/user', [UserController::class, 'update']);

    // Rentals (My Library)
    Route::get('/rentals', [RentalController::class, 'index']);
    Route::get('/rentals/history', [RentalController::class, 'history']);
    Route::get('/rentals/{filmId}/access', [RentalController::class, 'checkAccess']);
    Route::post('/rentals/{rental}/started', [RentalController::class, 'markStarted']);

    // Videos (Protected)
    Route::get('/videos/signed-url', [VideoController::class, 'getSignedUrl']);

    // Payments
    Route::post('/payments/initiate', [PaymentController::class, 'initiate']);
    Route::get('/payments/status/{transaction}', [PaymentController::class, 'status']);

    // Reviews (write)
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::get('/reviews/{filmId}/mine', [ReviewController::class, 'mine']);
    Route::patch('/reviews/{review}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| M-Pesa Callback (No Auth, IP Whitelisted)
|--------------------------------------------------------------------------
*/

Route::post('/payments/callback', [PaymentController::class, 'callback'])
    ->middleware('mpesa.whitelist');

/*
|--------------------------------------------------------------------------
| Admin Routes (Auth + Admin Role Required)
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [App\Http\Controllers\Admin\DashboardController::class, 'index']);

    // Films CRUD
    Route::apiResource('films', App\Http\Controllers\Admin\FilmController::class);

    // Transactions
    Route::get('/transactions', [App\Http\Controllers\Admin\TransactionController::class, 'index']);
    Route::get('/transactions/export', [App\Http\Controllers\Admin\TransactionController::class, 'export']);
    Route::get('/transactions/{transaction}', [App\Http\Controllers\Admin\TransactionController::class, 'show']);

    // Users
    Route::get('/users', [App\Http\Controllers\Admin\UserController::class, 'index']);
    Route::get('/users/{user}', [App\Http\Controllers\Admin\UserController::class, 'show']);
    Route::patch('/users/{user}', [App\Http\Controllers\Admin\UserController::class, 'update']);

    // Settings
    Route::get('/settings', [App\Http\Controllers\Admin\SettingController::class, 'index']);
    Route::patch('/settings', [App\Http\Controllers\Admin\SettingController::class, 'update']);
    Route::post('/settings/test-mpesa', [App\Http\Controllers\Admin\SettingController::class, 'testMpesa']);

    // Uploads
    Route::post('/upload/poster', [App\Http\Controllers\Admin\UploadController::class, 'poster']);

    // Genres & People
    Route::apiResource('genres', App\Http\Controllers\Admin\GenreController::class);
    Route::apiResource('people', App\Http\Controllers\Admin\PersonController::class);
});
