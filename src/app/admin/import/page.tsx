export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import React from 'react';
import { BatchImportManager } from '@/components/admin/BatchImportManager';

export default async function AdminImportPage() {
  return <BatchImportManager />;
}
