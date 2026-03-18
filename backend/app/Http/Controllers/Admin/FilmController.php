<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Film;
use App\Models\Genre;
use App\Models\Person;
use App\Models\FilmCredit;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class FilmController extends Controller
{
    public function __construct(
        private FileUploadService $fileUploadService
    ) {}

    /**
     * List all films (including unpublished).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Film::with(['genres'])->withCount('rentals');

        // Filter by status
        if ($request->has('status')) {
            $query->where('is_published', $request->status === 'published');
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                    ->orWhere('synopsis', 'LIKE', "%{$search}%");
            });
        }

        $films = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

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
     * Get a single film for editing.
     */
    public function show(Film $film): JsonResponse
    {
        $film->load(['genres', 'credits.person']);

        return response()->json([
            'success' => true,
            'film' => [
                'id' => $film->id,
                'title' => $film->title,
                'slug' => $film->slug,
                'synopsis' => $film->synopsis,
                'poster_url' => $film->poster_url,
                'trailer_url' => $film->trailer_url,
                'video_url' => $film->video_url,
                'price' => $film->price,
                'duration_mins' => $film->duration_mins,
                'release_year' => $film->release_year,
                'rating' => $film->rating,
                'is_published' => $film->is_published,
                'is_featured' => $film->is_featured,
                'genres' => $film->genres->pluck('id'),
                'credits' => $film->credits->map(fn($c) => [
                    'id' => $c->id,
                    'person_id' => $c->person_id,
                    'person' => [
                        'id' => $c->person->id,
                        'name' => $c->person->name,
                    ],
                    'role' => $c->role,
                    'character_name' => $c->character_name,
                    'order' => $c->order,
                ]),
                'created_at' => $film->created_at,
                'updated_at' => $film->updated_at,
            ],
        ]);
    }

    /**
     * Create a new film.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:films,slug'],
            'synopsis' => ['required', 'string'],
            'poster_url' => ['nullable', 'string'],
            'trailer_url' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:1'],
            'duration_mins' => ['nullable', 'integer', 'min:1'],
            'release_year' => ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 5)],
            'rating' => ['nullable', 'string', 'max:20'],
            'is_published' => ['boolean'],
            'is_featured' => ['boolean'],
            'genre_ids' => ['array'],
            'genre_ids.*' => ['exists:genres,id'],
            'credits' => ['array'],
            'credits.*.person_id' => ['required', 'exists:people,id'],
            'credits.*.role' => ['required', 'string'],
            'credits.*.character_name' => ['nullable', 'string'],
            'credits.*.order' => ['integer'],
        ]);

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        // Ensure unique slug
        $baseSlug = $validated['slug'];
        $counter = 1;
        while (Film::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $baseSlug . '-' . $counter++;
        }

        // If setting as featured, unset other featured films
        if ($validated['is_featured'] ?? false) {
            Film::where('is_featured', true)->update(['is_featured' => false]);
        }

        // Create film
        $film = Film::create([
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'synopsis' => $validated['synopsis'],
            'poster_url' => $validated['poster_url'] ?? null,
            'trailer_url' => $validated['trailer_url'] ?? null,
            'video_url' => $validated['video_url'] ?? null,
            'price' => $validated['price'],
            'duration_mins' => $validated['duration_mins'] ?? null,
            'release_year' => $validated['release_year'] ?? null,
            'rating' => $validated['rating'] ?? null,
            'is_published' => $validated['is_published'] ?? false,
            'is_featured' => $validated['is_featured'] ?? false,
        ]);

        // Attach genres
        if (!empty($validated['genre_ids'])) {
            $film->genres()->attach($validated['genre_ids']);
        }

        // Create credits
        if (!empty($validated['credits'])) {
            foreach ($validated['credits'] as $index => $credit) {
                FilmCredit::create([
                    'film_id' => $film->id,
                    'person_id' => $credit['person_id'],
                    'role' => $credit['role'],
                    'character_name' => $credit['character_name'] ?? null,
                    'order' => $credit['order'] ?? $index,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Film created successfully.',
            'film' => $film->load(['genres', 'credits.person']),
        ], 201);
    }

    /**
     * Update a film.
     */
    public function update(Request $request, Film $film): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('films')->ignore($film->id)],
            'synopsis' => ['sometimes', 'string'],
            'poster_url' => ['nullable', 'string'],
            'trailer_url' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string'],
            'price' => ['sometimes', 'integer', 'min:1'],
            'duration_mins' => ['nullable', 'integer', 'min:1'],
            'release_year' => ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 5)],
            'rating' => ['nullable', 'string', 'max:20'],
            'is_published' => ['boolean'],
            'is_featured' => ['boolean'],
            'genre_ids' => ['array'],
            'genre_ids.*' => ['exists:genres,id'],
            'credits' => ['array'],
            'credits.*.id' => ['nullable', 'exists:film_credits,id'],
            'credits.*.person_id' => ['required', 'exists:people,id'],
            'credits.*.role' => ['required', 'string'],
            'credits.*.character_name' => ['nullable', 'string'],
            'credits.*.order' => ['integer'],
        ]);

        // If setting as featured, unset other featured films
        if (($validated['is_featured'] ?? false) && !$film->is_featured) {
            Film::where('is_featured', true)->update(['is_featured' => false]);
        }

        // Update basic fields
        $film->update(collect($validated)->except(['genre_ids', 'credits'])->toArray());

        // Sync genres
        if (isset($validated['genre_ids'])) {
            $film->genres()->sync($validated['genre_ids']);
        }

        // Update credits
        if (isset($validated['credits'])) {
            // Get existing credit IDs
            $existingIds = $film->credits->pluck('id')->toArray();
            $newIds = [];

            foreach ($validated['credits'] as $index => $creditData) {
                if (!empty($creditData['id'])) {
                    // Update existing credit
                    $credit = FilmCredit::find($creditData['id']);
                    if ($credit && $credit->film_id === $film->id) {
                        $credit->update([
                            'person_id' => $creditData['person_id'],
                            'role' => $creditData['role'],
                            'character_name' => $creditData['character_name'] ?? null,
                            'order' => $creditData['order'] ?? $index,
                        ]);
                        $newIds[] = $credit->id;
                    }
                } else {
                    // Create new credit
                    $credit = FilmCredit::create([
                        'film_id' => $film->id,
                        'person_id' => $creditData['person_id'],
                        'role' => $creditData['role'],
                        'character_name' => $creditData['character_name'] ?? null,
                        'order' => $creditData['order'] ?? $index,
                    ]);
                    $newIds[] = $credit->id;
                }
            }

            // Delete removed credits
            $idsToDelete = array_diff($existingIds, $newIds);
            FilmCredit::whereIn('id', $idsToDelete)->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Film updated successfully.',
            'film' => $film->fresh(['genres', 'credits.person']),
        ]);
    }

    /**
     * Delete (archive) a film.
     */
    public function destroy(Film $film): JsonResponse
    {
        // Soft delete by unpublishing (or hard delete if no rentals)
        if ($film->rentals()->count() > 0) {
            $film->update(['is_published' => false]);
            return response()->json([
                'success' => true,
                'message' => 'Film has been archived (unpublished) because it has existing rentals.',
            ]);
        }

        $film->delete();

        return response()->json([
            'success' => true,
            'message' => 'Film deleted successfully.',
        ]);
    }
}
