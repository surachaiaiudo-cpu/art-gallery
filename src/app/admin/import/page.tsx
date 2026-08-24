export const runtime = 'edge';
import { getAllExhibitions } from '@/lib/data';
import { BatchImportManager } from '@/components/admin/BatchImportManager';

export const dynamic = 'force-dynamic';

export default async function AdminImportPage() {
  const exhibitions = await getAllExhibitions();
  return <BatchImportManager exhibitions={exhibitions} />;
}
