import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// In a real Firebase app, we'd check for a session cookie here.
// For now, we'll demonstrate the structure for /dashboard routes.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protect all /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // In production, verify session cookie
    // const session = request.cookies.get('session')
    // if (!session) {
    //   return NextResponse.redirect(new URL('/login', request.url))
    // }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/playground/:path*'],
}
