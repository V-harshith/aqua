import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// TEMPORARILY DISABLED MIDDLEWARE FOR AUTH DEBUGGING
export async function middleware(request: NextRequest) {
  console.log('🛡️ Middleware allowing all routes for debugging:', request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|sw.js|manifest.json|.*\\.png$|.*\\.jpg$|.*\\.ico$).*)',
  ],
};
