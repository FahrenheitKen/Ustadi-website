<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Genre;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GenreController extends Controller
{
    /**
     * List all genres.
     */
    public function index(): JsonResponse
    {
        $genres = Genre::withCount('films')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'genres' => $genres,
        ]);
    }

    /**
     * Create a new genre.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:genres,name'],
            'slug' => ['nullable', 'string', 'max:100', 'unique:genres,slug'],
        ]);

        $genre = Genre::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Genre created successfully.',
            'genre' => $genre,
        ], 201);
    }

    /**
     * Update a genre.
     */
    public function update(Request $request, Genre $genre): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100', 'unique:genres,name,' . $genre->id],
            'slug' => ['sometimes', 'string', 'max:100', 'unique:genres,slug,' . $genre->id],
        ]);

        $genre->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Genre updated successfully.',
            'genre' => $genre,
        ]);
    }

    /**
     * Delete a genre.
     */
    public function destroy(Genre $genre): JsonResponse
    {
        if ($genre->films()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete genre that has films assigned.',
            ], 422);
        }

        $genre->delete();

        return response()->json([
            'success' => true,
            'message' => 'Genre deleted successfully.',
        ]);
    }
}
