<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class MpesaIpWhitelist
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get the client IP
        $clientIp = $request->ip();

        // Get whitelisted IPs from config
        $whitelistedIps = config('mpesa.whitelist_ips', []);

        // In non-production environments, allow all IPs for testing
        if (config('mpesa.env') === 'sandbox' || app()->environment('local', 'testing')) {
            Log::info('M-Pesa callback received from IP: ' . $clientIp . ' (sandbox mode - all IPs allowed)');
            return $next($request);
        }

        // Check if the client IP is in the whitelist
        if (!in_array($clientIp, $whitelistedIps)) {
            Log::warning('M-Pesa callback rejected from unauthorized IP: ' . $clientIp);

            return response()->json([
                'ResultCode' => 1,
                'ResultDesc' => 'Rejected',
            ], 403);
        }

        Log::info('M-Pesa callback received from whitelisted IP: ' . $clientIp);

        return $next($request);
    }
}
