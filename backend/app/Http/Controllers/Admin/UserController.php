<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * List all users.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::withCount(['rentals', 'transactions' => function ($q) {
            $q->where('status', 'SUCCESS');
        }]);

        // Filter by role
        if ($request->has('role')) {
            $query->where('role', strtoupper($request->role));
        }

        // Filter by status
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%")
                    ->orWhere('phone', 'LIKE', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'users' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Get user details with rental history.
     */
    public function show(User $user): JsonResponse
    {
        $user->load(['rentals.film', 'transactions']);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'image' => $user->image,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
            ],
            'rentals' => $user->rentals->map(fn($r) => [
                'id' => $r->id,
                'film' => [
                    'id' => $r->film->id,
                    'title' => $r->film->title,
                    'slug' => $r->film->slug,
                ],
                'amount' => $r->amount,
                'status' => $r->getStatus(),
                'created_at' => $r->created_at,
            ]),
            'stats' => [
                'total_rentals' => $user->rentals->count(),
                'total_spent' => $user->transactions->where('status', 'SUCCESS')->sum('amount'),
            ],
        ]);
    }

    /**
     * Update user (enable/disable, change role).
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['sometimes', 'boolean'],
            'role' => ['sometimes', 'in:CUSTOMER,ADMIN'],
        ]);

        // Prevent disabling own account
        if (isset($validated['is_active']) && !$validated['is_active'] && $user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot disable your own account.',
            ], 422);
        }

        // Prevent demoting self from admin
        if (isset($validated['role']) && $validated['role'] !== 'ADMIN' && $user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot remove your own admin privileges.',
            ], 422);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->is_active,
            ],
        ]);
    }
}
