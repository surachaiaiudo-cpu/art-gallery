'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin';

  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        setError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4F0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#DDD7CC] p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-[#1A1918] rounded-full flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-[#C5A880]" />
          </div>
          <h1 className="text-xl font-bold text-[#1A1918] tracking-tight">ARTVARA Admin</h1>
          <p className="text-xs text-[#8C8477]">กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลนิทรรศการ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9488]" />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่านผู้ดูแลระบบ"
              className="w-full pl-10 pr-10 py-2.5 border border-[#DDD7CC] rounded-lg text-sm text-[#1A1918] bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]/30"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9488] hover:text-[#1A1918]"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 bg-[#1A1918] hover:bg-[#38342E] disabled:opacity-50 text-white rounded-lg text-sm font-semibold tracking-wide transition-all active:scale-95"
          >
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
}
