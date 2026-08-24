import React from 'react';
import { getAllExhibitions } from '@/lib/data';
import { Admin3DStudioClient } from '@/components/admin/Admin3DStudioClient';

export const dynamic = 'force-dynamic';

export default async function Admin3DStudioPage() {
  const exhibitions = await getAllExhibitions();
  return <Admin3DStudioClient initialExhibitions={exhibitions} />;
}
