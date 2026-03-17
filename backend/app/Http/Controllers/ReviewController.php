<?php

namespace App\Http\Controllers;

use App\Models\Film;
use App\Models\Rental;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Get reviews for a film.
     */
    public function index(Request $request, string $filmId): JsonResponse
    {
        $film = Film::published()->findOrFail($filmId);

        $reviews = Review::where('film_id', $filmId)
            ->approved()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 10));

        return response()->json([
            'success' => true,
            'reviews' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'total' => $reviews->total(),
            ],
            'average_rating' => $film->getAverageRating(),
        ]);
    }

    /**
     * Store a new review.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'film_id' => ['required', 'exists:films,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'string', 'max:5000'],
        ]);

        // Check if user has rented the film
        $rental = Rental::where('user_id', $user->id)
            ->where('film_id', $validated['film_id'])
            ->first();

        if (!$rental) {
            return response()->json([
                'success' => false,
                'message' => 'You must rent this film before leaving a review.',
            ], 403);
        }

        // Check if user already has a review for this film
        $existingReview = Review::where('user_id', $user->id)
            ->where('film_id', $validated['film_id'])
            ->first();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'You have already reviewed this film.',
            ], 422);
        }

        $review = Review::create([
            'user_id' => $user->id,
            'film_id' => $validated['film_id'],
            'rental_id' => $rental->id,
            'rating' => $validated['rating'],
            'title' => $validated['title'] ?? null,
            'content' => $validated['content'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully.',
            'review' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'title' => $review->title,
                'content' => $review->content,
                'created_at' => $review->created_at,
            ],
        ], 201);
    }

    /**
     * Get the user's review for a specific film.
     */
    public function mine(Request $request, string $filmId): JsonResponse
    {
        $user = $request->user();

        $review = Review::where('user_id', $user->id)
            ->where('film_id', $filmId)
            ->first();

        if (!$review) {
            return response()->json([
                'success' => true,
                'review' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'review' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'title' => $review->title,
                'content' => $review->content,
                'created_at' => $review->created_at,
            ],
        ]);
    }

    /**
     * Update a review.
     */
    public function update(Request $request, Review $review): JsonResponse
    {
        $user = $request->user();

        if ($review->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $validated = $request->validate([
            'rating' => ['sometimes', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'string', 'max:5000'],
        ]);

        $review->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Review updated successfully.',
            'review' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'title' => $review->title,
                'content' => $review->content,
                'created_at' => $review->created_at,
            ],
        ]);
    }

    /**
     * Delete a review.
     */
    public function destroy(Request $request, Review $review): JsonResponse
    {
        $user = $request->user();

        if ($review->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully.',
        ]);
    }
}
