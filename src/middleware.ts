import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Supabase auth error:', error)
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Handle sign-out
    if (req.nextUrl.pathname === '/auth/signout') {
      await supabase.auth.signOut()
      const response = NextResponse.redirect(new URL('/auth/login', req.url))
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }

    // Protect dashboard routes
    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Redirect authenticated users away from auth pages
    if (session && req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
} 