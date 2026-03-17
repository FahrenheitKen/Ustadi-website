<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class S3UploadService
{
    private string $disk;

    public function __construct()
    {
        $this->disk = config('filesystems.default') === 'local' ? 'public' : 's3';
    }

    /**
     * Upload a file to S3.
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

            // Upload to S3
            Storage::disk($this->disk)->put($path, file_get_contents($file), 'public');

            // Get the URL
            $url = Storage::disk($this->disk)->url($path);

            return [
                'success' => true,
                'path' => $path,
                'url' => $url,
                'filename' => $filename,
            ];
        } catch (\Exception $e) {
            Log::error('S3 upload failed', [
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
     * Delete a file from S3.
     */
    public function delete(string $path): bool
    {
        try {
            return Storage::disk($this->disk)->delete($path);
        } catch (\Exception $e) {
            Log::error('S3 delete failed', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get a presigned URL for direct upload.
     */
    public function getPresignedUploadUrl(string $path, string $contentType, int $expiresInMinutes = 30): array
    {
        try {
            $client = Storage::disk($this->disk)->getClient();
            $bucket = config('filesystems.disks.s3.bucket');

            $command = $client->getCommand('PutObject', [
                'Bucket' => $bucket,
                'Key' => $path,
                'ContentType' => $contentType,
            ]);

            $request = $client->createPresignedRequest($command, "+{$expiresInMinutes} minutes");

            return [
                'success' => true,
                'upload_url' => (string) $request->getUri(),
                'path' => $path,
                'expires_in' => $expiresInMinutes * 60,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate presigned upload URL', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate upload URL.',
            ];
        }
    }
}
