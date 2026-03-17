import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/library', '/profile', '/watch'];

// Routes that should redirect to home if already authenticated
const authRoutes = ['/login', '/register'];

// Admin routes (for future admin subdomain support)
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is an admin route (subdomain handling for future)
  const hostname = request.headers.get('host') || '';
  const isAdminSubdomain = hostname.startsWith('admin.');

  // Get auth token from cookie (set by frontend after login)
  // Note: We store token in localStorage on frontend, so middleware
  // can't check it directly. The protected pages handle auth checks
  // client-side. This middleware is for basic route setup.

  // For admin subdomain, check admin access (future implementation)
  if (isAdminSubdomain) {
    // Admin subdomain routes will be handled separately
    // For now, allow through and let client handle auth
    return NextResponse.next();
  }

  // Add security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CSP for video playback (allowing HLS from CloudFront)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://player.vimeo.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    "media-src 'self' blob: https: http:",
    "connect-src 'self' https: http: wss: ws:",
    "frame-src https://www.youtube.com https://player.vimeo.com",
    "worker-src 'self' blob:",
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
