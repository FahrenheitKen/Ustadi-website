<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Person;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonController extends Controller
{
    /**
     * List all people (cast/crew).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Person::withCount('credits');

        // Search
        if ($request->has('search')) {
            $query->where('name', 'LIKE', '%' . $request->search . '%');
        }

        $people = $query->orderBy('name')
            ->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'people' => $people->items(),
            'meta' => [
                'current_page' => $people->currentPage(),
                'last_page' => $people->lastPage(),
                'per_page' => $people->perPage(),
                'total' => $people->total(),
            ],
        ]);
    }

    /**
     * Create a new person.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'photo_url' => ['nullable', 'string', 'url'],
            'bio' => ['nullable', 'string', 'max:5000'],
        ]);

        $person = Person::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Person created successfully.',
            'person' => $person,
        ], 201);
    }

    /**
     * Update a person.
     */
    public function update(Request $request, Person $person): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'photo_url' => ['nullable', 'string', 'url'],
            'bio' => ['nullable', 'string', 'max:5000'],
        ]);

        $person->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Person updated successfully.',
            'person' => $person,
        ]);
    }

    /**
     * Delete a person.
     */
    public function destroy(Person $person): JsonResponse
    {
        if ($person->credits()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete person that has film credits.',
            ], 422);
        }

        $person->delete();

        return response()->json([
            'success' => true,
            'message' => 'Person deleted successfully.',
        ]);
    }
}
