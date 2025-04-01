import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    // Create a response to modify its headers
    const res = NextResponse.next()
    
    // Create the Supabase client
    const supabase = createMiddlewareClient(
      { req, res },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    )

    // Refresh session if expired - required for Server Components
    await supabase.auth.getSession()

    // Handle sign-out
    if (req.nextUrl.pathname === '/auth/signout') {
      try {
        await supabase.auth.signOut()
        const response = NextResponse.redirect(new URL('/auth/login', req.url))
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return response
      } catch (error) {
        console.error('Sign out error:', error)
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
    }

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Protect dashboard routes
    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Redirect authenticated users away from auth pages except callback
    if (session && req.nextUrl.pathname.startsWith('/auth') && !req.nextUrl.pathname.includes('/callback')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 