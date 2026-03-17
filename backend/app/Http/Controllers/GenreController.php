<?php

namespace App\Http\Controllers;

use App\Models\Genre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GenreController extends Controller
{
    /**
     * List all genres with published film counts.
     */
    public function index(): JsonResponse
    {
        $genres = Genre::withCount(['films' => function ($query) {
                $query->where('is_published', true);
            }])
            ->having('films_count', '>', 0)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'genres' => $genres->map(fn($genre) => [
                'id' => $genre->id,
                'name' => $genre->name,
                'slug' => $genre->slug,
                'film_count' => $genre->films_count,
            ]),
        ]);
    }

    /**
     * Get films by genre slug.
     */
    public function show(string $slug, Request $request): JsonResponse
    {
        $genre = Genre::where('slug', $slug)->first();

        if (!$genre) {
            return response()->json([
                'success' => false,
                'message' => 'Genre not found.',
            ], 404);
        }

        $films = $genre->publishedFilms()
            ->with(['genres'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 12));

        return response()->json([
            'success' => true,
            'genre' => [
                'id' => $genre->id,
                'name' => $genre->name,
                'slug' => $genre->slug,
            ],
            'films' => $films->items(),
            'meta' => [
                'current_page' => $films->currentPage(),
                'last_page' => $films->lastPage(),
                'per_page' => $films->perPage(),
                'total' => $films->total(),
            ],
        ]);
    }
}
