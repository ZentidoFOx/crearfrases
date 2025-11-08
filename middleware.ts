import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = [
  '/',
  '/perfil',
  '/seo',
  '/seo-ia',
  '/trafico',
  '/local',
  '/contenido',
  '/social',
  '/anuncios',
  '/rrpp',
  '/informes',
  '/usuarios',
  '/roles',
  '/dashboard',
  '/analiticas',
]

// Routes that are only for guests (logged out users)
const guestOnlyRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get the token from the cookie or header
  const token = request.cookies.get('access_token')?.value

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Check if the route is guest-only
  const isGuestOnlyRoute = guestOnlyRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Redirect to login if trying to access protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to home if trying to access guest-only route with token
  if (isGuestOnlyRoute && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
