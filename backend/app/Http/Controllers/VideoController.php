<?php

namespace App\Http\Controllers;

use App\Models\Film;
use App\Models\Rental;
use App\Services\CloudFrontService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoController extends Controller
{
    public function __construct(
        private CloudFrontService $cloudFrontService
    ) {}

    /**
     * Get signed URL for video playback.
     */
    public function getSignedUrl(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'film_id' => ['required', 'exists:films,id'],
        ]);

        $film = Film::findOrFail($validated['film_id']);

        // Check if film has a video URL
        if (empty($film->video_url)) {
            return response()->json([
                'success' => false,
                'message' => 'Video not available for this film.',
            ], 404);
        }

        // Get user's rental for this film
        $rental = Rental::where('user_id', $user->id)
            ->where('film_id', $film->id)
            ->orderBy('created_at', 'desc')
            ->first();

        // Check if user has access
        if (!$rental || !$rental->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this film. Please rent it first.',
            ], 403);
        }

        // Mark rental as started if not already (starts 48hr countdown)
        if ($rental->first_played === null) {
            $rental->markAsStarted();
        }

        // Generate signed URL (24 hours validity)
        $result = $this->cloudFrontService->getSignedUrl($film->video_url, 86400);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Failed to generate video URL.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'signed_url' => $result['signed_url'],
            'expires_at' => $result['expires_at'],
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
     * Get trailer URL (public, no signing needed).
     */
    public function getTrailerUrl(string $filmId): JsonResponse
    {
        $film = Film::published()->findOrFail($filmId);

        if (empty($film->trailer_url)) {
            return response()->json([
                'success' => false,
                'message' => 'Trailer not available for this film.',
            ], 404);
        }

        // For YouTube/Vimeo URLs, return as-is
        if ($this->isExternalUrl($film->trailer_url)) {
            return response()->json([
                'success' => true,
                'trailer_url' => $film->trailer_url,
                'type' => $this->getVideoType($film->trailer_url),
            ]);
        }

        // For hosted trailers, generate URL (trailers are public, no signing)
        $baseUrl = config('filesystems.disks.s3.cloudfront_url')
            ?: config('filesystems.disks.s3.url');

        return response()->json([
            'success' => true,
            'trailer_url' => rtrim($baseUrl, '/') . '/' . ltrim($film->trailer_url, '/'),
            'type' => 'hls',
        ]);
    }

    /**
     * Check if URL is external (YouTube, Vimeo, etc.).
     */
    private function isExternalUrl(string $url): bool
    {
        return str_starts_with($url, 'http://') || str_starts_with($url, 'https://');
    }

    /**
     * Get video type from URL.
     */
    private function getVideoType(string $url): string
    {
        if (str_contains($url, 'youtube.com') || str_contains($url, 'youtu.be')) {
            return 'youtube';
        }

        if (str_contains($url, 'vimeo.com')) {
            return 'vimeo';
        }

        if (str_ends_with($url, '.m3u8')) {
            return 'hls';
        }

        return 'direct';
    }
}
