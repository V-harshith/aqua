import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorCode = requestUrl.searchParams.get('error_code')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  // If there's an error in the URL, redirect to error page
  if (error || errorCode) {
    const errorUrl = new URL('/auth/error', request.url)
    if (error) errorUrl.searchParams.set('error', error)
    if (errorCode) errorUrl.searchParams.set('error_code', errorCode)
    if (errorDescription) errorUrl.searchParams.set('error_description', errorDescription)
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        // Successful auth, redirect to dashboard
        return NextResponse.redirect(new URL(next, request.url))
      } else {
        console.error('Exchange code error:', error)
        const errorUrl = new URL('/auth/error', request.url)
        errorUrl.searchParams.set('error', 'auth_callback_error')
        errorUrl.searchParams.set('error_description', error.message)
        return NextResponse.redirect(errorUrl)
      }
    } catch (error: any) {
      console.error('Auth callback error:', error)
      const errorUrl = new URL('/auth/error', request.url)
      errorUrl.searchParams.set('error', 'auth_callback_error')
      errorUrl.searchParams.set('error_description', error.message || 'Authentication failed')
      return NextResponse.redirect(errorUrl)
    }
  }

  // If no code and no error, redirect to signin
  return NextResponse.redirect(new URL('/signin', request.url))
} 