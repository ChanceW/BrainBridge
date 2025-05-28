import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Public paths that don't require authentication checks
    const publicPaths = ['/student/login', '/parent/login', '/error']
    if (publicPaths.includes(path)) {
      // If already authenticated, redirect to appropriate dashboard
      if (token) {
        const dashboardPath = token.role === 'student' ? '/student/dashboard' : '/parent/dashboard'
        return NextResponse.redirect(new URL(dashboardPath, req.url))
      }
      // Otherwise, allow access to public paths
      return NextResponse.next()
    }

    // Protected student routes
    if (path.startsWith('/student/')) {
      if (!token) {
        const loginUrl = new URL('/student/login', req.url)
        loginUrl.searchParams.set('callbackUrl', path)
        return NextResponse.redirect(loginUrl)
      }
      if (token.role !== 'student') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Protected parent routes
    if (path.startsWith('/parent/')) {
      if (!token) {
        const loginUrl = new URL('/parent/login', req.url)
        loginUrl.searchParams.set('callbackUrl', path)
        return NextResponse.redirect(loginUrl)
      }
      if (token.role !== 'parent') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // We'll handle authorization in the middleware function
    },
  }
)

export const config = {
  matcher: [
    '/student/:path*',
    '/parent/:path*',
    '/error'
  ],
} 