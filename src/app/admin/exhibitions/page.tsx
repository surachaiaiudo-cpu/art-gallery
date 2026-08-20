export const runtime = 'edge';
import { getAllExhibitions } from '@/lib/data';
import { AdminExhibitionsManagerClient } from '@/components/admin/AdminExhibitionsManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminExhibitionsPage() {
  const exhibitions = await getAllExhibitions();

  return <AdminExhibitionsManagerClient initialExhibitions={exhibitions} />;
}

