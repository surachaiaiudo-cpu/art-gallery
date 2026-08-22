import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};

export function middleware(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET_KEY;

  // If no secret is configured, allow access (backward compatible)
  if (!adminSecret) {
    return NextResponse.next();
  }

  // Check for a valid session cookie
  const sessionCookie = req.cookies.get('admin_session')?.value;
  if (sessionCookie === adminSecret) {
    return NextResponse.next();
  }

  // Not authenticated: redirect to login page
  const loginUrl = new URL('/admin/login', req.url);
  loginUrl.searchParams.set('from', req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
