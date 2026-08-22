import React, { Suspense } from 'react';
import AdminLoginForm from './AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F4F0] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#8C6D3F] border-t-transparent rounded-full animate-spin" /></div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
