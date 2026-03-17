<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\S3UploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function __construct(
        private S3UploadService $s3UploadService
    ) {}

    /**
     * Upload a poster image.
     */
    public function poster(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'image', 'max:10240'], // Max 10MB
            'film_id' => ['nullable', 'string'],
        ]);

        $filmId = $validated['film_id'] ?? null;
        $directory = $filmId
            ? "posters/{$filmId}"
            : 'posters/temp';

        $result = $this->s3UploadService->upload(
            $request->file('file'),
            $directory
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Upload failed.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Poster uploaded successfully.',
            'url' => $result['url'],
            'path' => $result['path'],
        ]);
    }

    /**
     * Get a presigned URL for direct upload to S3.
     */
    public function getPresignedUrl(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filename' => ['required', 'string'],
            'content_type' => ['required', 'string'],
            'directory' => ['required', 'string', 'in:posters,trailers,videos'],
            'film_id' => ['nullable', 'string'],
        ]);

        $directory = $validated['film_id']
            ? "{$validated['directory']}/{$validated['film_id']}"
            : "{$validated['directory']}/temp";

        $path = "{$directory}/{$validated['filename']}";

        $result = $this->s3UploadService->getPresignedUploadUrl(
            $path,
            $validated['content_type']
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Failed to generate upload URL.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'upload_url' => $result['upload_url'],
            'path' => $result['path'],
            'expires_in' => $result['expires_in'],
        ]);
    }
}
