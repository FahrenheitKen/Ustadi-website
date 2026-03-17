<?php

namespace App\Http\Controllers;

use App\Models\Film;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FilmController extends Controller
{
    /**
     * List published films with pagination and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Film::published()
            ->with(['genres', 'credits.person']);

        // Filter by genre
        if ($request->has('genre')) {
            $query->whereHas('genres', function ($q) use ($request) {
                $q->where('slug', $request->genre);
            });
        }

        // Filter by year
        if ($request->has('year')) {
            $query->where('release_year', $request->year);
        }

        // Search by title
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                    ->orWhere('synopsis', 'LIKE', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');

        switch ($sortBy) {
            case 'title':
                $query->orderBy('title', $sortOrder);
                break;
            case 'year':
                $query->orderBy('release_year', $sortOrder);
                break;
            case 'price':
                $query->orderBy('price', $sortOrder);
                break;
            case 'popular':
                $query->withCount('rentals')->orderBy('rentals_count', 'desc');
                break;
            default:
                $query->orderBy('created_at', $sortOrder);
        }

        $films = $query->paginate($request->get('per_page', 12));

        return response()->json([
            'success' => true,
            'films' => $films->items(),
            'meta' => [
                'current_page' => $films->currentPage(),
                'last_page' => $films->lastPage(),
                'per_page' => $films->perPage(),
                'total' => $films->total(),
            ],
        ]);
    }

    /**
     * Get the featured film for homepage hero.
     */
    public function featured(): JsonResponse
    {
        $film = Film::featured()
            ->with(['genres', 'credits.person'])
            ->first();

        if (!$film) {
            // Fallback to latest published film
            $film = Film::published()
                ->with(['genres', 'credits.person'])
                ->orderBy('created_at', 'desc')
                ->first();
        }

        if (!$film) {
            return response()->json([
                'success' => false,
                'message' => 'No featured film available.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'film' => $this->formatFilmWithDetails($film),
        ]);
    }

    /**
     * Get a single film by slug.
     */
    public function show(string $slug): JsonResponse
    {
        $film = Film::published()
            ->where('slug', $slug)
            ->with(['genres', 'credits.person', 'reviews.user'])
            ->first();

        if (!$film) {
            return response()->json([
                'success' => false,
                'message' => 'Film not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'film' => $this->formatFilmWithDetails($film),
        ]);
    }

    /**
     * Get new releases.
     */
    public function newReleases(Request $request): JsonResponse
    {
        $films = Film::published()
            ->with(['genres'])
            ->orderBy('created_at', 'desc')
            ->limit($request->get('limit', 10))
            ->get();

        return response()->json([
            'success' => true,
            'films' => $films->map(fn($film) => $this->formatFilmCard($film)),
        ]);
    }

    /**
     * Get popular films (most rented).
     */
    public function popular(Request $request): JsonResponse
    {
        $films = Film::published()
            ->with(['genres'])
            ->withCount('rentals')
            ->orderBy('rentals_count', 'desc')
            ->limit($request->get('limit', 10))
            ->get();

        return response()->json([
            'success' => true,
            'films' => $films->map(fn($film) => $this->formatFilmCard($film)),
        ]);
    }

    /**
     * Format film for card display.
     */
    private function formatFilmCard(Film $film): array
    {
        return [
            'id' => $film->id,
            'title' => $film->title,
            'slug' => $film->slug,
            'poster_url' => $film->poster_url,
            'price' => $film->price,
            'release_year' => $film->release_year,
            'rating' => $film->rating,
            'genres' => $film->genres->pluck('name'),
        ];
    }

    /**
     * Format film with full details.
     */
    private function formatFilmWithDetails(Film $film): array
    {
        $credits = $film->credits;
        $director = $credits->where('role', 'Director')->first();
        $cast = $credits->where('role', 'Actor')->sortBy('order');

        return [
            'id' => $film->id,
            'title' => $film->title,
            'slug' => $film->slug,
            'synopsis' => $film->synopsis,
            'poster_url' => $film->poster_url,
            'trailer_url' => $film->trailer_url,
            'price' => $film->price,
            'duration_mins' => $film->duration_mins,
            'release_year' => $film->release_year,
            'rating' => $film->rating,
            'genres' => $film->genres->map(fn($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'slug' => $g->slug,
            ]),
            'director' => $director ? [
                'id' => $director->person->id,
                'name' => $director->person->name,
                'photo_url' => $director->person->photo_url,
            ] : null,
            'cast' => $cast->map(fn($c) => [
                'id' => $c->person->id,
                'name' => $c->person->name,
                'photo_url' => $c->person->photo_url,
                'character_name' => $c->character_name,
            ])->values(),
            'average_rating' => $film->getAverageRating(),
            'review_count' => $film->reviews->count(),
            'reviews' => $film->reviews->take(5)->map(fn($r) => [
                'id' => $r->id,
                'rating' => $r->rating,
                'title' => $r->title,
                'content' => $r->content,
                'created_at' => $r->created_at,
                'user' => [
                    'name' => $r->user->name,
                    'image' => $r->user->image,
                ],
            ]),
        ];
    }
}
