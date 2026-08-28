'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('กรุณากรอกรหัสผ่าน (Please enter password)');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(from);
        router.refresh();
      } else {
        setError(data.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#161310] text-[#EDE8DF] flex flex-col justify-between selection:bg-[#D9B878] selection:text-black">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D9B878]/10 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <header className="p-6 md:p-8 flex items-center justify-between border-b border-white/10 relative z-10">
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FFD98A] to-[#8C6D3F] flex items-center justify-center text-black font-serif font-black text-sm shadow-md">
            A
          </div>
          <span className="font-serif font-bold text-lg text-white tracking-wider group-hover:text-[#FFD98A] transition-colors">
            ARTVARA
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs text-[#C5A880] hover:text-white transition-colors"
        >
          กลับหน้าหลัก
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 my-8">
        <div className="w-full max-w-md bg-[#211C18]/90 backdrop-blur-xl border border-[#D9B878]/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Top Gold Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D9B878] to-transparent" />

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#D9B878]/15 border border-[#D9B878]/40 flex items-center justify-center mx-auto mb-4 text-[#FFD98A] shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
              ผู้ดูแลระบบ / ภัณฑารักษ์
            </h1>
            <p className="text-xs text-[#C5A880] mt-1.5 font-sans">
              ARTVARA Exhibition & 3D Studio Admin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#FFD98A]"
                >
                  รหัสผ่านสำหรับผู้ดูแล (Admin Password)
                </label>
                <span className="text-[10px] text-[#A59582] bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  Localhost: admin1234
                </span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอก admin1234 หรือ admin..."
                  autoFocus
                  required
                  className="w-full px-4 py-3 bg-[#14110E] border border-white/15 focus:border-[#D9B878] rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#D9B878]/30 transition-all font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D9B878] to-[#B89355] hover:from-[#e6ca8a] hover:to-[#cfa663] text-black font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {loading ? (
                <span>กำลังตรวจสอบ...</span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <div className="inline-flex items-center space-x-1.5 text-[11px] text-[#A59582]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D9B878]" />
              <span>ระบบรักษาความปลอดภัยเซสชันแบบ HMAC-SHA256</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-[#8A7C6E] border-t border-white/5 relative z-10">
        ARTVARA Art Gallery • Admin Access Control
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#161310] flex items-center justify-center text-[#D9B878]">
          <div className="animate-spin w-8 h-8 border-2 border-[#D9B878] border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
