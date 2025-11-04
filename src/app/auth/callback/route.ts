import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  // Simple redirect logic for auth callback
  if (code) {
    return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.redirect(new URL('/', request.url))
}
