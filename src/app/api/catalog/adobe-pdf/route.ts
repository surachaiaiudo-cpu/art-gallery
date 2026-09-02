import { NextRequest, NextResponse } from 'next/server';
import { createAdobePdfJob, checkAdobePdfJob } from '@/lib/adobePdfService';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * POST /api/catalog/adobe-pdf
 * Starts Adobe PDF conversion job and returns polling location immediately (Fast 300ms response)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      html,
      pageWidthInches = 8.0,
      pageHeightInches = 8.0,
      filename = 'artvara-catalog-adobe.pdf',
    } = body;

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'Valid HTML content is required' },
        { status: 400 }
      );
    }

    const { pollingLocation } = await createAdobePdfJob({
      html,
      pageWidthInches: Number(pageWidthInches) || 8.0,
      pageHeightInches: Number(pageHeightInches) || 8.0,
    });

    return NextResponse.json({
      status: 'submitted',
      pollingLocation,
      filename,
    });
  } catch (err: any) {
    console.error('Adobe PDF Job submission error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit Adobe PDF job' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/catalog/adobe-pdf?location=...
 * Checks job status on Adobe Cloud and returns direct S3 downloadUri when ready
 */
export async function GET(req: NextRequest) {
  try {
    const location = req.nextUrl.searchParams.get('location');
    if (!location) {
      return NextResponse.json({ error: 'Polling location parameter is required' }, { status: 400 });
    }

    const jobResult = await checkAdobePdfJob(location);
    return NextResponse.json(jobResult);
  } catch (err: any) {
    console.error('Adobe PDF Status Check error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to check Adobe PDF status' },
      { status: 500 }
    );
  }
}