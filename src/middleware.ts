import { NextRequest, NextResponse } from 'next/server';

export const config = {
  // Protect /admin and all sub-paths EXCEPT the login page and auth API itself
  matcher: ['/admin', '/admin/((?!login|api).*)'],
};

export function middleware(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET_KEY;

  // If no secret is configured, allow access (backward compatible)
  if (!adminSecret) {
    return NextResponse.next();
  }

  // Never redirect the login page or auth API (prevent infinite loop)
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith('/admin/login') || pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next();
  }

  // Check for a valid session cookie
  const sessionCookie = req.cookies.get('admin_session')?.value;
  if (sessionCookie === adminSecret) {
    return NextResponse.next();
  }

  // Not authenticated: redirect to login page
  const loginUrl = new URL('/admin/login', req.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}
