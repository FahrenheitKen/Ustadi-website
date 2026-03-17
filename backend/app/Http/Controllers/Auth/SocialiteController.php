<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class SocialiteController extends Controller
{
    /**
     * Redirect to Google OAuth.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    /**
     * Handle Google OAuth callback.
     */
    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            // Check if user already exists with this Google ID
            $user = User::where('google_id', $googleUser->getId())->first();

            if (!$user) {
                // Check if user exists with same email
                $user = User::where('email', $googleUser->getEmail())->first();

                if ($user) {
                    // Link Google account to existing user
                    $user->update([
                        'google_id' => $googleUser->getId(),
                        'image' => $user->image ?? $googleUser->getAvatar(),
                        'email_verified_at' => $user->email_verified_at ?? now(),
                    ]);
                } else {
                    // Create new user
                    $user = User::create([
                        'name' => $googleUser->getName(),
                        'email' => $googleUser->getEmail(),
                        'google_id' => $googleUser->getId(),
                        'image' => $googleUser->getAvatar(),
                        'email_verified_at' => now(),
                        'role' => 'CUSTOMER',
                    ]);
                }
            } else {
                // Update user info from Google
                $user->update([
                    'image' => $user->image ?? $googleUser->getAvatar(),
                ]);
            }

            if (!$user->is_active) {
                return redirect(config('app.frontend_url') . '/login?error=account_disabled');
            }

            // Create token
            $token = $user->createToken('auth-token')->plainTextToken;

            // Redirect to frontend with token
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

            return redirect("{$frontendUrl}/auth/callback?token={$token}");

        } catch (\Exception $e) {
            return redirect(config('app.frontend_url') . '/login?error=oauth_failed');
        }
    }
}
