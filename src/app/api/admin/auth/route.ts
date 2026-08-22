export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const adminSecret = process.env.ADMIN_SECRET_KEY;

    if (!adminSecret) {
      // No secret configured — auth bypass (safe for single-curator setup)
      return NextResponse.json({ ok: true });
    }

    if (password !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_session', adminSecret, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('admin_session');
  return res;
}
