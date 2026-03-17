<?php

namespace App\Http\Controllers;

use App\Models\Film;
use App\Models\Rental;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RentalController extends Controller
{
    /**
     * Get the user's rentals (My Library).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $rentals = Rental::where('user_id', $user->id)
            ->with(['film.genres'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'rentals' => $rentals->map(fn($rental) => [
                'id' => $rental->id,
                'film' => [
                    'id' => $rental->film->id,
                    'title' => $rental->film->title,
                    'slug' => $rental->film->slug,
                    'poster_url' => $rental->film->poster_url,
                    'duration_mins' => $rental->film->duration_mins,
                    'genres' => $rental->film->genres->pluck('name'),
                ],
                'amount' => $rental->amount,
                'status' => $rental->getStatus(),
                'first_played' => $rental->first_played,
                'access_expires' => $rental->access_expires,
                'remaining_hours' => $rental->getRemainingHours(),
                'created_at' => $rental->created_at,
            ]),
        ]);
    }

    /**
     * Check if user has access to a specific film.
     */
    public function checkAccess(Request $request, string $filmId): JsonResponse
    {
        $user = $request->user();

        $rental = Rental::where('user_id', $user->id)
            ->where('film_id', $filmId)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$rental) {
            return response()->json([
                'success' => true,
                'has_access' => false,
                'rental' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'has_access' => $rental->isActive(),
            'rental' => [
                'id' => $rental->id,
                'status' => $rental->getStatus(),
                'first_played' => $rental->first_played,
                'access_expires' => $rental->access_expires,
                'remaining_hours' => $rental->getRemainingHours(),
            ],
        ]);
    }

    /**
     * Mark a rental as started (first play).
     */
    public function markStarted(Request $request, Rental $rental): JsonResponse
    {
        $user = $request->user();

        // Verify the rental belongs to the user
        if ($rental->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        // Check if rental is still valid
        if (!$rental->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Your rental has expired.',
            ], 403);
        }

        // Mark as started (this sets first_played and access_expires)
        $rental->markAsStarted();

        return response()->json([
            'success' => true,
            'message' => 'Rental started. You have 48 hours to watch.',
            'rental' => [
                'id' => $rental->id,
                'status' => $rental->getStatus(),
                'first_played' => $rental->first_played,
                'access_expires' => $rental->access_expires,
                'remaining_hours' => $rental->getRemainingHours(),
            ],
        ]);
    }

    /**
     * Get rental history for user profile.
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        $rentals = Rental::where('user_id', $user->id)
            ->with(['film', 'transaction'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'rentals' => $rentals->items(),
            'meta' => [
                'current_page' => $rentals->currentPage(),
                'last_page' => $rentals->lastPage(),
                'per_page' => $rentals->perPage(),
                'total' => $rentals->total(),
            ],
        ]);
    }
}
