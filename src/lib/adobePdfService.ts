// Adobe PDF Services Cloud Engine Integration
// Generates 100% genuine Adobe PostScript-quality PDFs via Adobe Document Cloud

const ADOBE_CLIENT_ID = process.env.ADOBE_CLIENT_ID || '20d5f6dd12a84c8b8e9df6ec40a837bd';
const ADOBE_CLIENT_SECRET = process.env.ADOBE_CLIENT_SECRET || 'p8e-9s2quzNyBhvybzdaYi_qtAUSDYVJ-vMK';

interface GenerateAdobePdfOptions {
  html: string;
  pageWidthInches?: number;
  pageHeightInches?: number;
}

/**
 * 1. Get Adobe OAuth S2S Access Token
 */
export async function getAdobeAccessToken(): Promise<string> {
  const tokenParams = new URLSearchParams({
    client_id: ADOBE_CLIENT_ID,
    client_secret: ADOBE_CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope: 'openid,AdobeID,read_organizations',
  });

  const res = await fetch('https://ims-na1.adobelogin.com/ims/token/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenParams.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get Adobe OAuth token (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/**
 * 2. Start Adobe PDF Generation Job (Async Non-Blocking for Cloudflare Pages)
 */
export async function createAdobePdfJob({
  html,
  pageWidthInches = 8.0,
  pageHeightInches = 8.0,
}: GenerateAdobePdfOptions): Promise<{ pollingLocation: string }> {
  const accessToken = await getAdobeAccessToken();

  // Step A: Request Presigned Upload Asset URI
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

  const { uploadUri, assetID } = (await assetRes.json()) as {
    uploadUri: string;
    assetID: string;
  };

  // Step B: Upload HTML document
  const uploadRes = await fetch(uploadUri, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/html',
    },
    body: html,
  });

  if (!uploadRes.ok) {
    throw new Error(`Failed to upload HTML to Adobe storage (${uploadRes.status})`);
  }

  // Step C: Submit HTML-to-PDF Conversion Job
  const jobBody = {
    assetID,
    pageLayout: {
      pageWidth: pageWidthInches,
      pageHeight: pageHeightInches,
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
    throw new Error(`Adobe HTML-to-PDF job submission failed (${jobRes.status}): ${errorText}`);
  }

  const pollingLocation = jobRes.headers.get('location');
  if (!pollingLocation) {
    throw new Error('Adobe did not return a polling location');
  }

  return { pollingLocation };
}

/**
 * 3. Check Adobe PDF Job Status
 */
export async function checkAdobePdfJob(pollingLocation: string): Promise<{
  status: 'in_progress' | 'done' | 'failed';
  downloadUri?: string;
  error?: string;
}> {
  const accessToken = await getAdobeAccessToken();

  const pollRes = await fetch(pollingLocation, {
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
    return { status: 'done', downloadUri: pollData.asset.downloadUri };
  } else if (pollData.status === 'failed') {
    return { status: 'failed', error: JSON.stringify(pollData.error || 'Job failed') };
  }

  return { status: 'in_progress' };
}