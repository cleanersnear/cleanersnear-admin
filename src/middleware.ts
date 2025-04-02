import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Add CSP headers
  res.headers.set(
    'Content-Security-Policy',
    `connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in;`
  )

  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Handle sign-out
  if (req.nextUrl.pathname === '/auth/signout') {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
    
    // Clear all auth-related cookies
    const response = NextResponse.redirect(new URL('/auth/login', req.url))
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    response.cookies.delete('sb-provider-token')
    response.cookies.delete('sb-user-id')
    return response
  }

  // Handle auth callback
  if (req.nextUrl.pathname === '/auth/callback') {
    return res
  }

  // Protect dashboard routes
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    // Don't redirect if it's the callback URL
    if (req.nextUrl.pathname === '/auth/callback') {
      return res
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
} 