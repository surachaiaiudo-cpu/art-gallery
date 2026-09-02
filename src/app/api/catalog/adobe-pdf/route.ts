import { NextRequest, NextResponse } from 'next/server';
import { getAdobeAccessToken } from '@/lib/adobePdfService';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const ADOBE_CLIENT_ID = process.env.ADOBE_CLIENT_ID || '20d5f6dd12a84c8b8e9df6ec40a837bd';

/**
 * POST /api/catalog/adobe-pdf?action=create-asset | start-job
 * Lightweight, 0 CPU overhead, completely bypasses Cloudflare Worker size & timeout limits
 */
export async function POST(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action') || 'create-asset';
    const accessToken = await getAdobeAccessToken();

    // 1. Get Presigned S3 Upload URL from Adobe
    if (action === 'create-asset') {
      const assetRes = await fetch('https://pdf-services.adobe.io/assets', {
        method: 'POST',
        headers: {
          'x-api-key': ADOBE_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaType: 'text/html' }),
      });

      if (!assetRes.ok) {
        const errorText = await assetRes.text();
        throw new Error(`Adobe asset creation failed (${assetRes.status}): ${errorText}`);
      }

      const data = await assetRes.json();
      return NextResponse.json(data);
    }

    // 2. Start HTML-to-PDF Conversion Job (using uploaded assetID)
    if (action === 'start-job') {
      const body = await req.json();
      const { assetID, pageWidthInches = 8.0, pageHeightInches = 8.0 } = body;

      if (!assetID) {
        return NextResponse.json({ error: 'assetID is required' }, { status: 400 });
      }

      const jobBody = {
        assetID,
        pageLayout: {
          pageWidth: Number(pageWidthInches) || 8.0,
          pageHeight: Number(pageHeightInches) || 8.0,
        },
        includeHeaderFooter: false,
      };

      const jobRes = await fetch('https://pdf-services.adobe.io/operation/htmltopdf', {
        method: 'POST',
        headers: {
          'x-api-key': ADOBE_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobBody),
      });

      if (jobRes.status !== 201) {
        const errorText = await jobRes.text();
        throw new Error(`Adobe job submission failed (${jobRes.status}): ${errorText}`);
      }

      const pollingLocation = jobRes.headers.get('location');
      return NextResponse.json({ pollingLocation });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Adobe PDF API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process Adobe PDF request' },
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

    const accessToken = await getAdobeAccessToken();
    const pollRes = await fetch(location, {
      method: 'GET',
      headers: {
        'x-api-key': ADOBE_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!pollRes.ok) {
      const errorText = await pollRes.text();
      throw new Error(`Failed to poll Adobe job status (${pollRes.status}): ${errorText}`);
    }

    const pollData = (await pollRes.json()) as {
      status: string;
      asset?: { downloadUri: string };
      error?: any;
    };

    if (pollData.status === 'done' && pollData.asset?.downloadUri) {
      return NextResponse.json({ status: 'done', downloadUri: pollData.asset.downloadUri });
    } else if (pollData.status === 'failed') {
      return NextResponse.json({ status: 'failed', error: JSON.stringify(pollData.error || 'Job failed') });
    }

    return NextResponse.json({ status: 'in_progress' });
  } catch (err: any) {
    console.error('Adobe PDF Status Check error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to check Adobe PDF status' },
      { status: 500 }
    );
  }
}