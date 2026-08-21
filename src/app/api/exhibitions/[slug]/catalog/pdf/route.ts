import { NextRequest, NextResponse } from 'next/server';
import { getExhibitionBySlug } from '@/lib/data';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getCatalogFooterText, getCatalogPlateFooterText, getExhibitionPeerReviewers } from '@/types/exhibition';
import { formatDateRange, formatPrice } from '@/lib/utils';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';

export const dynamic = 'force-dynamic';
const execAsync = promisify(exec);

// Find available Chrome or Edge binary
function getBrowserExecutablePath(): string | null {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Generate 100% WYSIWYG HTML for the Catalog
function buildCatalogHTML(exhibition: any, standard: string): string {
  const isPdfX = standard === 'pdfx';
  const coverFooter = getCatalogFooterText(exhibition);
  const plateFooter = getCatalogPlateFooterText(exhibition);
  const reviewers = getExhibitionPeerReviewers(exhibition);
  const hasReviewers = reviewers.length > 0;
  const artworks = exhibition.artworks || [];
  const curator = exhibition.curator;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>${exhibition.title} - Official Exhibition Catalog</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Maitree:wght@300;400;500;600;700&family=Prompt:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: 210mm 297mm;
      margin: 0 !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 210mm;
      background: #ffffff;
      color: #000000;
      font-family: 'Maitree', serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .head-font {
      font-family: 'Prompt', 'Sukhumvit Set', sans-serif !important;
    }
    .body-font {
      font-family: 'Maitree', serif !important;
    }
    .a4-page {
      width: 210mm;
      height: 297mm;
      min-height: 297mm;
      max-height: 297mm;
      padding: 15mm;
      background: #ffffff;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    /* Cover Page */
    .cover-header {
      border-bottom: 1px solid #E0E0E0;
      padding-bottom: 12px;
      margin-bottom: 16px;
      text-align: center;
    }
    .cover-logo {
      font-family: 'Prompt', sans-serif;
      font-size: 26pt;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: #000000;
    }
    .cover-sub {
      font-size: 8pt;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #666666;
      margin-top: 4px;
    }
    .cover-banner-container {
      width: 100%;
      height: 140mm;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .cover-banner-img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
    .cover-details {
      text-align: center;
      margin-top: auto;
      margin-bottom: auto;
    }
    .catalog-badge {
      font-family: 'Prompt', sans-serif;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #333333;
      margin-bottom: 6px;
    }
    .cover-title {
      font-family: 'Prompt', sans-serif;
      font-size: 20pt;
      font-weight: 700;
      color: #000000;
      line-height: 1.3;
      margin-bottom: 8px;
    }
    .curator-line {
      font-size: 10pt;
      color: #444444;
      margin-bottom: 4px;
    }
    .peer-review-cover-line {
      font-size: 8.5pt;
      color: #555555;
      margin-bottom: 4px;
    }
    .date-line {
      font-size: 9pt;
      color: #666666;
      margin-top: 4px;
    }
    .cover-footer-row {
      border-top: 1px solid #E0E0E0;
      padding-top: 12px;
      text-align: center;
      font-size: 8pt;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* Page 2: Reviewers */
    .page2-header {
      border-bottom: 1px solid #E0E0E0;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .reviewer-card {
      background: #FAFAFA;
      border: 1px solid #E8E8E8;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .reviewer-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .reviewer-avatar {
      width: 40px;
      height: 48px;
      border-radius: 4px;
      object-fit: cover;
      background: #E0E0E0;
    }
    .reviewer-initial {
      width: 40px;
      height: 48px;
      border-radius: 4px;
      background: #EFEFEF;
      border: 1px solid #DCDCDC;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Prompt', sans-serif;
      font-size: 14pt;
      font-weight: 700;
      color: #444444;
    }
    .reviewer-badge {
      font-family: 'Prompt', sans-serif;
      font-size: 8pt;
      font-weight: 700;
      background: #EAEAEA;
      color: #000000;
      padding: 2px 6px;
      border-radius: 3px;
      margin-right: 6px;
    }
    .reviewer-name {
      font-family: 'Prompt', sans-serif;
      font-size: 9.5pt;
      font-weight: 700;
      color: #000000;
    }
    .reviewer-institution {
      font-size: 8.5pt;
      color: #555555;
      margin-top: 2px;
    }
    .reviewer-country {
      font-size: 8.5pt;
      color: #777777;
    }
    .statement-box {
      border-top: 1px solid #E8E8E8;
      padding-top: 14px;
      margin-top: 12px;
    }
    .statement-title {
      font-family: 'Prompt', sans-serif;
      font-size: 10.5pt;
      font-weight: 700;
      color: #000000;
      margin-bottom: 6px;
    }
    .statement-quote {
      font-size: 9pt;
      color: #333333;
      line-height: 1.6;
      font-style: italic;
    }

    /* Artwork Pages */
    .artwork-image-wrapper {
      width: 100%;
      height: 175mm;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      background: #FFFFFF;
    }
    .artwork-img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
    .artwork-info-row {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      position: relative;
      z-index: 10;
    }
    .artist-col {
      width: 70px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .country-flag-img {
      width: 32px;
      height: 18px;
      border-radius: 2px;
      border: 1px solid #D0D0D0;
      margin-bottom: 6px;
      object-fit: cover;
    }
    .artist-photo-img {
      width: 68px;
      height: 82px;
      border-radius: 6px;
      object-fit: cover;
      background: #1A1A1A;
    }
    .artist-initial-box {
      width: 68px;
      height: 82px;
      border-radius: 6px;
      background: #F8F8F8;
      border: 1px solid #D0D0D0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Prompt', sans-serif;
      font-size: 22pt;
      font-weight: 700;
      color: #333333;
    }
    .details-col {
      flex: 1;
      color: #222222;
    }
    .artist-title-name {
      font-family: 'Prompt', sans-serif;
      font-size: 12pt;
      font-weight: 700;
      color: #000000;
      line-height: 1.2;
    }
    .artist-email-text {
      font-size: 8pt;
      font-family: monospace;
      color: #666666;
      margin-top: 1px;
    }
    .artist-country-text {
      font-size: 8.5pt;
      color: #666666;
      margin-bottom: 6px;
    }
    .artwork-main-title {
      font-family: 'Prompt', sans-serif;
      font-size: 11pt;
      font-weight: 700;
      color: #000000;
      line-height: 1.2;
    }
    .artwork-specs-text {
      font-size: 8.5pt;
      color: #444444;
      margin-top: 2px;
      margin-bottom: 6px;
    }
    .concept-box {
      font-size: 8.5pt;
      line-height: 1.5;
      color: #333333;
      margin-top: 4px;
    }
    .concept-tag {
      font-family: 'Prompt', sans-serif;
      font-weight: 700;
      color: #000000;
    }
    .wave-bg {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 90px;
      pointer-events: none;
      z-index: 1;
      opacity: 0.35;
    }
    .plate-footer {
      border-top: 1px solid #E5E5E5;
      padding-top: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8pt;
      color: #777777;
      position: relative;
      z-index: 10;
    }
    .page-number {
      font-family: 'Prompt', sans-serif;
      font-weight: 700;
      color: #555555;
    }
  </style>
</head>
<body>
  <!-- PAGE 1: COVER PAGE -->
  <div class="a4-page">
    <div>
      <div class="cover-header">
        <div class="cover-logo">ARTVARA</div>
        <div class="cover-sub">International Art Festival & Curated Exhibition</div>
      </div>

      ${
        exhibition.bannerUrl
          ? `<div class="cover-banner-container">
               <img src="${exhibition.bannerUrl}" class="cover-banner-img" alt="${exhibition.title}">
             </div>`
          : ''
      }

      <div class="cover-details">
        <div class="catalog-badge">Official Exhibition Catalog (สูจิบัตร)</div>
        <h1 class="cover-title">${exhibition.title}</h1>
        ${
          curator?.name
            ? `<div class="curator-line">Curated by: <strong style="color:#000;">${curator.name}</strong></div>`
            : ''
        }
        ${
          hasReviewers
            ? `<div class="peer-review-cover-line">Peer Review Committee: <strong style="color:#000;">${reviewers
                .map((r: any) => [r.academicTitle, r.name].filter(Boolean).join(' '))
                .join(' • ')}</strong></div>`
            : ''
        }
        <div class="date-line">${formatDateRange(exhibition.startDate, exhibition.endDate)}</div>
      </div>
    </div>

    <div class="cover-footer-row">
      ${coverFooter}
    </div>
  </div>

  <!-- PAGE 2: PEER REVIEWERS & CURATORIAL STATEMENT -->
  ${
    hasReviewers
      ? `
  <div class="a4-page">
    <div>
      <div class="page2-header">
        <div class="head-font" style="font-size: 20pt; font-weight: 700; letter-spacing: 0.15em; color: #000;">ARTVARA</div>
        <div class="body-font" style="font-size: 8pt; text-transform: uppercase; color: #666; letter-spacing: 0.1em; margin-top: 2px;">
          Academic Peer Review Board & Curatorial Statement
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <div class="head-font" style="font-size: 10.5pt; font-weight: 700; color: #000; margin-bottom: 2px;">
          คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Review Committee)
        </div>
        <div style="font-size: 8pt; color: #666;">
          รายนามคณะกรรมการผู้ทรงคุณวุฒิในการพิจารณาและประเมินผลงานศิลปกรรมในนิทรรศการ
        </div>
      </div>

      ${reviewers
        .map(
          (reviewer: any, idx: number) => `
        <div class="reviewer-card">
          <div class="reviewer-left">
            ${
              reviewer.avatarUrl
                ? `<img src="${reviewer.avatarUrl}" class="reviewer-avatar" alt="${reviewer.name}">`
                : `<div class="reviewer-initial">${(reviewer.name || 'R').trim().charAt(0).toUpperCase()}</div>`
            }
            <div>
              <div style="display:flex; align-items:center;">
                <span class="reviewer-badge">${reviewer.role || (idx === 0 ? 'ประธานกรรมการ' : 'กรรมการผู้ทรงคุณวุฒิ')}</span>
                <span class="reviewer-name">${[reviewer.academicTitle, reviewer.name].filter(Boolean).join(' ')}</span>
              </div>
              ${reviewer.institution ? `<div class="reviewer-institution">${reviewer.institution}</div>` : ''}
            </div>
          </div>
          ${reviewer.country ? `<div class="reviewer-country">${reviewer.country}</div>` : ''}
        </div>
      `
        )
        .join('')}

      ${
        exhibition.curatorNote
          ? `
        <div class="statement-box">
          <div class="statement-title">คำนำภัณฑารักษ์ (Curatorial Statement)</div>
          <div class="statement-quote">"${exhibition.curatorNote}"</div>
          ${curator?.name ? `<div class="head-font" style="font-size: 8.5pt; font-weight: 700; color: #000; text-align: right; margin-top: 8px;">— ${curator.name} (Curator)</div>` : ''}
        </div>
      `
          : ''
      }
    </div>

    <div class="plate-footer">
      <span>${plateFooter || 'Editorial & Academic Accreditation Board'}</span>
      <span class="page-number">2</span>
    </div>
  </div>
  `
      : ''
  }

  <!-- PAGES 3+: ARTWORK PLATES -->
  ${artworks
    .map((art: any, idx: number) => {
      const artist = art.artist;
      const pageNum = hasReviewers ? idx + 3 : idx + 2;
      const flagUrl = getFlagImageUrl(artist?.country);
      const hasRealPhoto =
        artist?.avatarUrl &&
        !artist.avatarUrl.includes('unsplash.com/photo-1507003211169') &&
        !artist.avatarUrl.includes('unsplash.com/photo-1534528741775');
      const concept = art.concept?.trim() || art.description?.trim();

      return `
    <div class="a4-page">
      <div>
        <div class="artwork-image-wrapper">
          ${art.imageUrl ? `<img src="${art.imageUrl}" class="artwork-img" alt="${art.title}">` : ''}
        </div>

        <div class="artwork-info-row">
          <div class="artist-col">
            ${flagUrl ? `<img src="${flagUrl}" class="country-flag-img" alt="flag">` : ''}
            ${
              hasRealPhoto
                ? `<img src="${artist.avatarUrl}" class="artist-photo-img" alt="${artist.name}">`
                : `<div class="artist-initial-box">${(artist?.name || 'A').trim().charAt(0).toUpperCase()}</div>`
            }
          </div>

          <div class="details-col">
            <div class="artist-title-name">${artist?.name || 'Artist'}</div>
            ${artist?.email ? `<div class="artist-email-text">${artist.email}</div>` : ''}
            <div class="artist-country-text">${artist?.country || 'International'}</div>

            <div class="artwork-main-title">${art.title}</div>
            <div class="artwork-specs-text">
              ${[art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : ''].filter(Boolean).join(' ')}
            </div>

            ${
              concept
                ? `<div class="concept-box">
                     <span class="concept-tag">Concept : </span>
                     <span>${concept}</span>
                   </div>`
                : ''
            }
          </div>
        </div>
      </div>

      <div class="wave-bg">
        <svg viewBox="0 0 600 120" style="width:100%; height:100%;" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveG1-${art.id}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#D0D0D0" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#B0B0B0" stop-opacity="0.15" />
            </linearGradient>
            <linearGradient id="waveG2-${art.id}" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#F5B28B" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#EFA478" stop-opacity="0.1" />
            </linearGradient>
          </defs>
          <path d="M-30,120 C120,40 260,130 380,60 C480,0 560,90 630,30 L630,120 Z" fill="url(#waveG1-${art.id})" />
          <path d="M-30,120 C90,90 220,20 370,80 C490,140 570,60 630,70 L630,120 Z" fill="url(#waveG2-${art.id})" />
        </svg>
      </div>

      <div class="plate-footer">
        <span>${[plateFooter, art.price ? formatPrice(art.price) : ''].filter(Boolean).join(' • ')}</span>
        <span class="page-number">${pageNum}</span>
      </div>
    </div>
    `;
    })
    .join('')}
</body>
</html>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const exhibition = await getExhibitionBySlug(slug);
    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 });
    }

    const standardParam = req.nextUrl.searchParams.get('standard');
    const isPdfX = standardParam === 'pdfx' || standardParam === 'pdfx1a';
    const standard = isPdfX ? 'pdfx' : 'standard';

    const cleanSlug = exhibition.slug || 'exhibition';
    const fileName = isPdfX
      ? `${cleanSlug}-catalog-PDFX-1a-2001.pdf`
      : `${cleanSlug}-catalog-Standard.pdf`;

    const html = buildCatalogHTML(exhibition, standard);
    const browserPath = getBrowserExecutablePath();

    if (browserPath) {
      const tempDir = os.tmpdir();
      const tempHtmlPath = path.join(tempDir, `catalog_${cleanSlug}_${Date.now()}.html`);
      const tempPdfPath = path.join(tempDir, `catalog_${cleanSlug}_${Date.now()}.pdf`);

      fs.writeFileSync(tempHtmlPath, html, 'utf8');

      const cmd = `"${browserPath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${tempPdfPath}" "${tempHtmlPath}"`;
      await execAsync(cmd);

      if (fs.existsSync(tempPdfPath)) {
        const pdfBuffer = fs.readFileSync(tempPdfPath);

        // Clean up temp files
        try {
          fs.unlinkSync(tempHtmlPath);
          fs.unlinkSync(tempPdfPath);
        } catch (e) {}

        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': pdfBuffer.length.toString(),
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      }
    }

    // Fallback if browser not available on host
    return NextResponse.json({ error: 'Browser engine not available' }, { status: 500 });
  } catch (err) {
    console.error('Error generating 100% Vector Skia PDF:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
