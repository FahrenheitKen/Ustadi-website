<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadService
{
    /**
     * Upload a file to local public storage.
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param string|null $filename
     * @return array
     */
    public function upload(UploadedFile $file, string $directory, ?string $filename = null): array
    {
        try {
            // Generate filename if not provided
            if (!$filename) {
                $extension = $file->getClientOriginalExtension();
                $filename = Str::ulid() . '.' . $extension;
            }

            $path = $directory . '/' . $filename;

            // Store file in public disk (storage/app/public)
            Storage::disk('public')->put($path, file_get_contents($file), 'public');

            // Get the public URL
            $url = Storage::disk('public')->url($path);

            return [
                'success' => true,
                'path' => $path,
                'url' => $url,
                'filename' => $filename,
            ];
        } catch (\Exception $e) {
            Log::error('File upload failed', [
                'directory' => $directory,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to upload file.',
            ];
        }
    }

    /**
     * Upload a poster image.
     */
    public function uploadPoster(UploadedFile $file, string $filmId): array
    {
        return $this->upload($file, "posters/{$filmId}");
    }

    /**
     * Delete a file from local public storage.
     */
    public function delete(string $path): bool
    {
        try {
            return Storage::disk('public')->delete($path);
        } catch (\Exception $e) {
            Log::error('File delete failed', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
