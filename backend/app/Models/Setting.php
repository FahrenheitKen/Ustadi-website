<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class Setting extends Model
{
    use HasFactory;

    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'key',
        'value',
    ];

    // Keys that should be encrypted
    private static array $encryptedKeys = [
        'mpesa_consumer_key',
        'mpesa_consumer_secret',
        'mpesa_passkey',
    ];

    public static function get(string $key, $default = null): mixed
    {
        return Cache::remember("setting.{$key}", 3600, function () use ($key, $default) {
            $setting = self::find($key);
            if (!$setting) {
                return $default;
            }

            $value = $setting->value;

            // Decrypt if this is an encrypted key
            if (in_array($key, self::$encryptedKeys) && $value) {
                try {
                    $value = Crypt::decryptString($value);
                } catch (\Exception $e) {
                    // Value might not be encrypted yet
                }
            }

            return $value;
        });
    }

    public static function set(string $key, $value): void
    {
        // Encrypt sensitive values
        if (in_array($key, self::$encryptedKeys) && $value) {
            $value = Crypt::encryptString($value);
        }

        self::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );

        Cache::forget("setting.{$key}");
    }

    public static function getAll(): array
    {
        return self::all()->pluck('value', 'key')->toArray();
    }

    public static function getMpesaConfig(): array
    {
        return [
            'env' => self::get('mpesa_env', config('mpesa.env')),
            'consumer_key' => self::get('mpesa_consumer_key', config('mpesa.consumer_key')),
            'consumer_secret' => self::get('mpesa_consumer_secret', config('mpesa.consumer_secret')),
            'business_short_code' => self::get('mpesa_business_short_code', config('mpesa.business_short_code')),
            'passkey' => self::get('mpesa_passkey', config('mpesa.passkey')),
            'callback_url' => self::get('mpesa_callback_url', config('mpesa.callback_url')),
        ];
    }
}
