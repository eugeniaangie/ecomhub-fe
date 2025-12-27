import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const url = request.nextUrl.clone();
    const { pathname } = url;

    // Public routes that don't require authentication
    const publicRoutes = ['/login'];
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    // Check for token in cookies (if backend sets http-only cookies)
    const token = request.cookies.get('access_token')?.value;
    
    // Also check Authorization header (for API routes)
    const authHeader = request.headers.get('authorization');
    const hasToken = !!token || !!authHeader;

    // If accessing a protected route without token, redirect to login
    if (!isPublicRoute && !hasToken) {
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // If accessing login page with token, redirect to dashboard
    if (isPublicRoute && hasToken && pathname === '/login') {
      url.pathname = '/';
      url.searchParams.delete('redirect');
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    // Log error and allow request to continue to prevent middleware failure
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

