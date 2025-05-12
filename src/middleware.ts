import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware protects routes that require authentication
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the user is authenticated
  const isAuthenticated = !!session;
  const isAuthRoute = req.nextUrl.pathname.startsWith('/signin') || 
                     req.nextUrl.pathname.startsWith('/signup') || 
                     req.nextUrl.pathname.startsWith('/reset-password');

  // Redirect unauthenticated users to sign in page if they try to access protected routes
  if (!isAuthenticated && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // Redirect authenticated users to dashboard if they try to access auth routes
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/dashboard/:path*', '/signin', '/signup', '/reset-password'],
};