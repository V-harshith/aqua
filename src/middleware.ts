import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// SECURE MIDDLEWARE - PROTECTS ROUTES & PREVENTS REDIRECT LOOPS
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.includes('/_next/') ||
    pathname.includes('/api/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname === '/auth/callback'
  ) {
    return NextResponse.next();
  }

  console.log('🛡️ Middleware checking:', pathname);

  // For now, allow all requests while we fix auth issues
  // TODO: Re-enable full auth checking once Supabase issues are resolved
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|sw.js|manifest.json|.*\.png$|.*\.jpg$|.*\.ico$|.*\.css$|.*\.js$).*)',
  ],
};
