import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Check for token in cookies
  const token = request.cookies.get('access_token')?.value;
  
  // Also check Authorization header (for API routes)
  const authHeader = request.headers.get('authorization');
  const hasToken = !!token || !!authHeader;

  // If accessing a protected route without token, redirect to login
  if (!isPublicRoute && !hasToken) {
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login page with token, redirect to dashboard
  if (isPublicRoute && hasToken && pathname === '/login') {
    const dashboardUrl = new URL('/', baseUrl);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
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

