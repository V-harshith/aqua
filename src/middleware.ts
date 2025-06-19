import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// TEMPORARILY DISABLED MIDDLEWARE TO FIX AUTH ISSUES
export async function middleware(req: NextRequest) {
  console.log('🔧 Middleware DISABLED - allowing all requests');
  return NextResponse.next();
}

export const config = {
  matcher: [],
};