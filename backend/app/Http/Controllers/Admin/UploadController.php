<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function __construct(
        private FileUploadService $fileUploadService
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

        $result = $this->fileUploadService->upload(
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
}
