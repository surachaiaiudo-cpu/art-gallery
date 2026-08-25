import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(sessionCookie);

  if (!session) {
    // API routes return 401 JSON
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน (Authentication required)',
        },
        { status: 401 }
      );
    }

    // Page routes redirect to /login with ?from=
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
