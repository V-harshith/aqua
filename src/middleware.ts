import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// TEMPORARILY DISABLED TO FIX REDIRECT LOOP - USING REAL SUPABASE DATA
export async function middleware(request: NextRequest) {
  console.log('🛡️ Middleware temporarily disabled to fix redirect loop:', request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|sw.js|manifest.json|.*\\.png$|.*\\.jpg$|.*\\.ico$|.*\\.css$|.*\\.js$).*)',
  ],
};
