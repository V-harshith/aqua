import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Rate limiting store (in-memory for demo, use Redis in production)
const rateLimit = new Map();

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Apply rate limiting
  const rateLimitResult = applyRateLimit(request);
  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  const path = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/signin', 
    '/signup', 
    '/reset-password', 
    '/', 
    '/update-password',
    '/auth/callback',  // Add auth callback route
    '/auth/error'      // Add auth error route
  ];
  
  // Check if current path is public or starts with public route
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith('/update-password') || path.startsWith('/auth/callback') || path.startsWith('/auth/error')
  );
  
  if (isPublicRoute) {
    return response;
  }

  // API routes protection
  if (path.startsWith('/api/')) {
    // Get session for API routes
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Role-based API access
    const protectedApiRoutes = {
      '/api/admin/': ['admin'],
      '/api/products/': ['admin', 'product_manager'],
      '/api/services/': ['admin', 'service_manager', 'technician'],
      '/api/technicians/': ['admin', 'service_manager'],
      '/api/inventory/': ['admin', 'product_manager']
    };

    for (const [route, allowedRoles] of Object.entries(protectedApiRoutes)) {
      if (path.startsWith(route)) {
        const userRole = session.user?.user_metadata?.role;
        if (!allowedRoles.includes(userRole)) {
          return new NextResponse(
            JSON.stringify({ error: 'Forbidden - Insufficient permissions' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    return response;
  }

  // Protected page routes - get session ONCE
  const { data: { session }, error } = await supabase.auth.getSession();
  
  // If no session, redirect to signin
  if (!session || error) {
    const redirectUrl = new URL('/signin', request.url);
    if (path !== '/signin') {
      redirectUrl.searchParams.set('redirectTo', path);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Allow dashboard access for all authenticated users
  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    return response;
  }

  // Role-based page access for specific routes
  const roleBasedRoutes = {
    '/admin': ['admin'],
    '/products': ['admin', 'product_manager'],
    '/services': ['admin', 'service_manager', 'technician'],
    '/distribution': ['admin', 'driver_manager'],
    '/driver': ['admin', 'driver_manager']
  };

  for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
    if (path.startsWith(route)) {
      const userRole = session.user?.user_metadata?.role;
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/access-denied', request.url));
      }
    }
  }

  return response;
}

function applyRateLimit(request: NextRequest): { allowed: boolean; retryAfter?: number } {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // 100 requests per minute

  const clientRequests = rateLimit.get(ip) || [];
  const requestsInWindow = clientRequests.filter((time: number) => now - time < windowMs);

  if (requestsInWindow.length >= maxRequests) {
    const oldestRequest = Math.min(...requestsInWindow);
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  requestsInWindow.push(now);
  rateLimit.set(ip, requestsInWindow);

  // Clean up old entries
  if (Math.random() < 0.01) { // 1% chance to clean up
    for (const [key, requests] of rateLimit.entries()) {
      const validRequests = requests.filter((time: number) => now - time < windowMs);
      if (validRequests.length === 0) {
        rateLimit.delete(key);
      } else {
        rateLimit.set(key, validRequests);
      }
    }
  }

  return { allowed: true };
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|sw.js|manifest.json|.*\\.png$|.*\\.jpg$|.*\\.ico$).*)',
  ],
};