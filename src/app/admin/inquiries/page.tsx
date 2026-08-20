import React from 'react';
import { getAllInquiries } from '@/lib/data';
import { AdminInquiriesClient } from '@/components/admin/AdminInquiriesClient';

export const dynamic = 'force-dynamic';

export default async function AdminInquiriesPage() {
  const inquiries = await getAllInquiries();
  return <AdminInquiriesClient inquiries={inquiries} />;
}
