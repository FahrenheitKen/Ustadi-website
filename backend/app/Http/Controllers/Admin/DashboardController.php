<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Film;
use App\Models\Rental;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics.
     */
    public function index(): JsonResponse
    {
        // Basic counts
        $totalFilms = Film::count();
        $publishedFilms = Film::where('is_published', true)->count();
        $totalUsers = User::where('role', 'CUSTOMER')->count();
        $totalRentals = Rental::count();

        // Revenue stats (30 days)
        $thirtyDaysAgo = now()->subDays(30);
        $revenue30Days = Transaction::where('status', 'SUCCESS')
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->sum('amount');

        $rentals30Days = Rental::where('created_at', '>=', $thirtyDaysAgo)->count();

        // Recent transactions
        $recentTransactions = Transaction::with(['user:id,name,email', 'film:id,title,slug'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'user' => $t->user ? [
                    'id' => $t->user->id,
                    'name' => $t->user->name,
                    'email' => $t->user->email,
                ] : null,
                'film' => $t->film ? [
                    'id' => $t->film->id,
                    'title' => $t->film->title,
                ] : null,
                'amount' => $t->amount,
                'status' => $t->status,
                'created_at' => $t->created_at,
            ]);

        // Top films by rentals
        $topFilms = Film::withCount('rentals')
            ->orderBy('rentals_count', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'title' => $f->title,
                'rentals_count' => $f->rentals_count,
            ]);

        return response()->json([
            'success' => true,
            'stats' => [
                'total_films' => $totalFilms,
                'published_films' => $publishedFilms,
                'total_users' => $totalUsers,
                'total_rentals' => $totalRentals,
                'revenue_30_days' => $revenue30Days,
                'rentals_30_days' => $rentals30Days,
            ],
            'recent_transactions' => $recentTransactions,
            'top_films' => $topFilms,
        ]);
    }
}
