export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, getAdminPassword, getAdminSecret, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    const inputPassword = typeof password === 'string' ? password.trim() : '';
    const expectedPassword = getAdminPassword().trim();

    if (!inputPassword || inputPassword !== expectedPassword) {
      return NextResponse.json(
        { error: 'รหัสผ่านไม่ถูกต้อง (Invalid password)' },
        { status: 401 }
      );
    }

    const secret = getAdminSecret();
    const token = await createSessionToken(secret, SESSION_MAX_AGE_SECONDS);

    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ (Login successful)',
    });

    // Set HttpOnly signed cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในระบบ (Internal server error)' },
      { status: 500 }
    );
  }
}
