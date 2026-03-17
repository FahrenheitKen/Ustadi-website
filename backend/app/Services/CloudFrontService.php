<?php

namespace App\Services;

use Aws\CloudFront\CloudFrontClient;
use Illuminate\Support\Facades\Log;

class CloudFrontService
{
    private ?CloudFrontClient $cloudFront = null;
    private string $distributionUrl;
    private string $keyPairId;
    private string $privateKey;

    public function __construct()
    {
        $this->distributionUrl = config('filesystems.disks.s3.cloudfront_url', '');
        $this->keyPairId = config('filesystems.disks.s3.cloudfront_key_pair_id', '');

        // Decode base64-encoded private key
        $encodedKey = config('filesystems.disks.s3.cloudfront_private_key', '');
        $this->privateKey = $encodedKey ? base64_decode($encodedKey) : '';

        if ($this->keyPairId && $this->privateKey) {
            $this->cloudFront = new CloudFrontClient([
                'version' => 'latest',
                'region' => config('filesystems.disks.s3.region', 'us-east-1'),
            ]);
        }
    }

    /**
     * Generate a signed URL for a video resource.
     *
     * @param string $path The S3 path (e.g., videos/film123/full/index.m3u8)
     * @param int $expiresInSeconds Time until URL expires (default 24 hours)
     * @return array
     */
    public function getSignedUrl(string $path, int $expiresInSeconds = 86400): array
    {
        // If CloudFront is not configured, return the direct S3 URL
        if (!$this->cloudFront || !$this->distributionUrl) {
            $baseUrl = config('filesystems.disks.s3.url', '');
            return [
                'success' => true,
                'signed_url' => rtrim($baseUrl, '/') . '/' . ltrim($path, '/'),
                'expires_at' => now()->addSeconds($expiresInSeconds)->toIso8601String(),
                'signed' => false,
            ];
        }

        try {
            $url = rtrim($this->distributionUrl, '/') . '/' . ltrim($path, '/');
            $expires = time() + $expiresInSeconds;

            $signedUrl = $this->cloudFront->getSignedUrl([
                'url' => $url,
                'expires' => $expires,
                'private_key' => $this->privateKey,
                'key_pair_id' => $this->keyPairId,
            ]);

            return [
                'success' => true,
                'signed_url' => $signedUrl,
                'expires_at' => now()->addSeconds($expiresInSeconds)->toIso8601String(),
                'signed' => true,
            ];
        } catch (\Exception $e) {
            Log::error('CloudFront signed URL generation failed', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate video URL.',
            ];
        }
    }

    /**
     * Generate a signed cookie for streaming access.
     *
     * @param string $resourcePattern The CloudFront resource pattern
     * @param int $expiresInSeconds Time until cookie expires
     * @return array
     */
    public function getSignedCookies(string $resourcePattern, int $expiresInSeconds = 86400): array
    {
        if (!$this->cloudFront) {
            return [
                'success' => false,
                'message' => 'CloudFront is not configured.',
            ];
        }

        try {
            $expires = time() + $expiresInSeconds;

            $policy = json_encode([
                'Statement' => [
                    [
                        'Resource' => $resourcePattern,
                        'Condition' => [
                            'DateLessThan' => [
                                'AWS:EpochTime' => $expires,
                            ],
                        ],
                    ],
                ],
            ], JSON_UNESCAPED_SLASHES);

            $cookies = $this->cloudFront->getSignedCookie([
                'policy' => $policy,
                'private_key' => $this->privateKey,
                'key_pair_id' => $this->keyPairId,
            ]);

            return [
                'success' => true,
                'cookies' => $cookies,
                'expires_at' => now()->addSeconds($expiresInSeconds)->toIso8601String(),
            ];
        } catch (\Exception $e) {
            Log::error('CloudFront signed cookie generation failed', [
                'resource' => $resourcePattern,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate video access cookies.',
            ];
        }
    }

    /**
     * Check if CloudFront signing is properly configured.
     */
    public function isConfigured(): bool
    {
        return $this->cloudFront !== null
            && !empty($this->distributionUrl)
            && !empty($this->keyPairId)
            && !empty($this->privateKey);
    }
}
