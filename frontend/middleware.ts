import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // Define protected paths
  // We protect root "/" but allow "/login" and "/signup"
  // This means user must be logged in to see the dashboard
  const protectedPaths = ['/', '/chatbot', '/stock'];
  
  const isProtected = protectedPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  );

  // If trying to access protected route without token, redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Optional: If user is logged in and tries to access /login or /signup, redirect to home
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && token) {
     const homeUrl = new URL('/', request.url);
     return NextResponse.redirect(homeUrl);
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};