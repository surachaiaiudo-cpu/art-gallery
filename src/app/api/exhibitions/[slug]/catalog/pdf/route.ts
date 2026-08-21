import { NextRequest, NextResponse } from 'next/server';
import { getExhibitionBySlug } from '@/lib/data';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { getCatalogFooterText, getCatalogPlateFooterText, getExhibitionPeerReviewers } from '@/types/exhibition';
import { formatDateRange, formatPrice } from '@/lib/utils';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';

export const dynamic = 'force-dynamic';

// Helper to fetch remote image and convert to Base64 on server (0 CORS restrictions)
async function fetchImageAsBase64(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Artvara-PDF-Generator' } });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error('Error fetching image on server for PDF:', url, err);
    return null;
  }
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
    const cleanSlug = exhibition.slug || 'exhibition';
    const fileName = isPdfX
      ? `${cleanSlug}-catalog-PDFX-1a-2001.pdf`
      : `${cleanSlug}-catalog-Standard.pdf`;

    const coverFooter = getCatalogFooterText(exhibition);
    const plateFooter = getCatalogPlateFooterText(exhibition);
    const reviewers = getExhibitionPeerReviewers(exhibition);
    const hasReviewers = reviewers.length > 0;
    const artworks = exhibition.artworks || [];
    const curator = exhibition.curator;

    // 1. Initialize jsPDF (A4: 210mm x 297mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: !isPdfX,
    });

    // 2. Load and Embed Real TrueType Vector Fonts:
    // Head: Sukhumvit / Prompt (Geometric Sans-serif)
    // Body / Content: Maitree (Regular & Bold)
    const fontsDir = path.join(process.cwd(), 'src', 'assets', 'fonts');

    // Embed Head Font (Sukhumvit / Prompt)
    const promptBoldPath = path.join(fontsDir, 'Prompt-Bold.ttf');
    const promptRegPath = path.join(fontsDir, 'Prompt-Regular.ttf');
    if (fs.existsSync(promptBoldPath)) {
      const bBuf = fs.readFileSync(promptBoldPath);
      doc.addFileToVFS('HeadFont-Bold.ttf', bBuf.toString('base64'));
      doc.addFont('HeadFont-Bold.ttf', 'HeadFont', 'bold');
    }
    if (fs.existsSync(promptRegPath)) {
      const rBuf = fs.readFileSync(promptRegPath);
      doc.addFileToVFS('HeadFont-Regular.ttf', rBuf.toString('base64'));
      doc.addFont('HeadFont-Regular.ttf', 'HeadFont', 'normal');
    }

    // Embed Content Font (Maitree)
    const maitreeRegPath = path.join(fontsDir, 'Maitree-Regular.ttf');
    const maitreeBoldPath = path.join(fontsDir, 'Maitree-Bold.ttf');
    if (fs.existsSync(maitreeRegPath)) {
      const mRegBuf = fs.readFileSync(maitreeRegPath);
      doc.addFileToVFS('Maitree-Regular.ttf', mRegBuf.toString('base64'));
      doc.addFont('Maitree-Regular.ttf', 'Maitree', 'normal');
    }
    if (fs.existsSync(maitreeBoldPath)) {
      const mBoldBuf = fs.readFileSync(maitreeBoldPath);
      doc.addFileToVFS('Maitree-Bold.ttf', mBoldBuf.toString('base64'));
      doc.addFont('Maitree-Bold.ttf', 'Maitree', 'bold');
    }

    // Default fonts
    const headFont = 'HeadFont';
    const bodyFont = 'Maitree';

    doc.setFont(headFont, 'bold');

    // Set ISO Document Properties
    doc.setProperties({
      title: `${exhibition.title} - Official Exhibition Catalog`,
      subject: isPdfX
        ? 'PDF/X-1a:2001 ISO 15930-1 Prepress Commercial Print-Ready Vector Catalog'
        : 'Standard Digital Vector Catalog',
      author: curator?.name || 'ARTVARA Curatorial Team',
      keywords: 'ARTVARA, Exhibition Catalog, Vector Typography, Sukhumvit, Maitree, Embedded TrueType Fonts, ISO 15930-1',
      creator: 'ARTVARA High-Fidelity Vector Catalog Generator (Sukhumvit + Maitree Typography Engine)',
    });

    // -------------------------------------------------------------
    // PAGE 1: COVER PAGE
    // -------------------------------------------------------------
    doc.setFont(headFont, 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text('ARTVARA', 105, 22, { align: 'center' });

    doc.setFont(bodyFont, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.text('INTERNATIONAL ART FESTIVAL & CURATED EXHIBITION', 105, 27, { align: 'center' });

    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.3);
    doc.line(15, 31, 195, 31);

    let yPos = 36;
    if (exhibition.bannerUrl) {
      const bannerB64 = await fetchImageAsBase64(exhibition.bannerUrl);
      if (bannerB64) {
        try {
          doc.addImage(bannerB64, 'JPEG', 20, yPos, 170, 135, undefined, 'FAST');
        } catch (e) {}
      }
      yPos += 142;
    } else {
      yPos += 40;
    }

    doc.setFont(headFont, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 51, 51);
    doc.text('OFFICIAL EXHIBITION CATALOG (สูจิบัตร)', 105, yPos, { align: 'center' });
    yPos += 8;

    doc.setFont(headFont, 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    const titleLines = doc.splitTextToSize(exhibition.title, 170);
    doc.text(titleLines, 105, yPos, { align: 'center' });
    yPos += titleLines.length * 8 + 2;

    if (curator?.name) {
      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(68, 68, 68);
      doc.text(`Curated by: ${curator.name}`, 105, yPos, { align: 'center' });
      yPos += 6;
    }

    if (hasReviewers) {
      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(85, 85, 85);
      const revText = `Peer Review Committee: ${reviewers.map(r => [r.academicTitle, r.name].filter(Boolean).join(' ')).join(' • ')}`;
      const revLines = doc.splitTextToSize(revText, 170);
      doc.text(revLines, 105, yPos, { align: 'center' });
      yPos += revLines.length * 4.5 + 2;
    }

    doc.setFont(bodyFont, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text(formatDateRange(exhibition.startDate, exhibition.endDate), 105, yPos, { align: 'center' });

    doc.setDrawColor(224, 224, 224);
    doc.line(15, 280, 195, 280);
    doc.setFont(bodyFont, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.text(coverFooter, 105, 286, { align: 'center' });

    // -------------------------------------------------------------
    // PAGE 2: PEER REVIEW COMMITTEE & CURATORIAL STATEMENT
    // -------------------------------------------------------------
    if (hasReviewers) {
      doc.addPage('a4', 'portrait');

      doc.setFont(headFont, 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('ARTVARA', 15, 22);

      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(102, 102, 102);
      doc.text('ACADEMIC PEER REVIEW BOARD & CURATORIAL STATEMENT', 15, 27);

      doc.setDrawColor(224, 224, 224);
      doc.line(15, 30, 195, 30);

      doc.setFont(headFont, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Review Committee)', 15, 38);

      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text('รายนามคณะกรรมการผู้ทรงคุณวุฒิในการพิจารณาและประเมินผลงานศิลปกรรมในนิทรรศการ', 15, 43);

      let cardY = 48;
      for (let i = 0; i < reviewers.length; i++) {
        const rev = reviewers[i];
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(232, 232, 232);
        doc.roundedRect(15, cardY, 180, 16, 1.5, 1.5, 'FD');

        if (rev.avatarUrl) {
          const avB64 = await fetchImageAsBase64(rev.avatarUrl);
          if (avB64) {
            try {
              doc.addImage(avB64, 'JPEG', 17, cardY + 2, 10, 12);
            } catch (e) {}
          }
        } else {
          doc.setFillColor(239, 239, 239);
          doc.rect(17, cardY + 2, 10, 12, 'F');
          doc.setFont(headFont, 'bold');
          doc.setFontSize(9);
          doc.setTextColor(68, 68, 68);
          doc.text(rev.name?.trim().charAt(0).toUpperCase() || 'R', 22, cardY + 9.5, { align: 'center' });
        }

        doc.setFont(headFont, 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);
        const roleText = rev.role || (i === 0 ? 'ประธานกรรมการ' : 'กรรมการผู้ทรงคุณวุฒิ');
        const fullName = [rev.academicTitle, rev.name].filter(Boolean).join(' ');
        doc.text(`[${roleText}]  ${fullName}`, 30, cardY + 7);

        if (rev.institution) {
          doc.setFont(bodyFont, 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(85, 85, 85);
          doc.text(rev.institution, 30, cardY + 12);
        }

        if (rev.country) {
          doc.setFont(bodyFont, 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(119, 119, 119);
          doc.text(rev.country, 190, cardY + 9.5, { align: 'right' });
        }

        cardY += 19;
      }

      if (exhibition.curatorNote) {
        cardY += 4;
        doc.setDrawColor(232, 232, 232);
        doc.line(15, cardY, 195, cardY);
        cardY += 6;

        doc.setFont(headFont, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('คำนำภัณฑารักษ์ (Curatorial Statement)', 15, cardY);
        cardY += 6;

        doc.setFont(bodyFont, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 51, 51);
        const noteLines = doc.splitTextToSize(`"${exhibition.curatorNote}"`, 180);
        doc.text(noteLines, 15, cardY);
        cardY += noteLines.length * 4.5;

        if (curator?.name) {
          doc.setFont(bodyFont, 'bold');
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          doc.text(`— ${curator.name} (Curator)`, 195, cardY + 2, { align: 'right' });
        }
      }

      doc.setDrawColor(229, 229, 229);
      doc.line(15, 282, 195, 282);
      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(119, 119, 119);
      doc.text(plateFooter || 'Editorial & Academic Accreditation Board', 15, 287);
      doc.text('2', 195, 287, { align: 'right' });
    }

    // -------------------------------------------------------------
    // PAGE 3+: ARTWORK PLATES
    // -------------------------------------------------------------
    for (let idx = 0; idx < artworks.length; idx++) {
      const art = artworks[idx];
      const artist = art.artist;
      const pageNum = hasReviewers ? idx + 3 : idx + 2;

      doc.addPage('a4', 'portrait');

      // 1. Artwork Image (175mm height, 180mm width)
      if (art.imageUrl) {
        const artB64 = await fetchImageAsBase64(art.imageUrl);
        if (artB64) {
          try {
            doc.addImage(artB64, 'JPEG', 15, 15, 180, 175, undefined, 'FAST');
          } catch (e) {
            console.error('Error adding artwork image to PDF:', e);
          }
        }
      }

      // 2. Details Section (Starts at 196mm from top)
      const detailY = 196;

      // Flag on top
      const flagUrl = getFlagImageUrl(artist?.country);
      if (flagUrl) {
        const flagB64 = await fetchImageAsBase64(flagUrl);
        if (flagB64) {
          try {
            doc.addImage(flagB64, 'PNG', 15, detailY, 12, 7);
          } catch (e) {}
        }
      }

      // Artist Photo below Flag
      const hasRealPhoto =
        artist?.avatarUrl &&
        !artist.avatarUrl.includes('unsplash.com/photo-1507003211169') &&
        !artist.avatarUrl.includes('unsplash.com/photo-1534528741775');

      if (hasRealPhoto) {
        const photoB64 = await fetchImageAsBase64(artist!.avatarUrl!);
        if (photoB64) {
          try {
            doc.addImage(photoB64, 'JPEG', 15, detailY + 9, 20, 24);
          } catch (e) {}
        }
      } else {
        doc.setFillColor(248, 248, 248);
        doc.setDrawColor(208, 208, 208);
        doc.roundedRect(15, detailY + 9, 20, 24, 1.5, 1.5, 'FD');
        doc.setFont(headFont, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(51, 51, 51);
        doc.text(artist?.name?.trim().charAt(0).toUpperCase() || 'A', 25, detailY + 24, { align: 'center' });
      }

      const textX = 40;
      let rightY = detailY + 2;

      // Artist Name (HeadFont bold)
      doc.setFont(headFont, 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(artist?.name || 'Artist', textX, rightY);
      rightY += 4.5;

      // Email & Country (Maitree normal)
      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(102, 102, 102);
      if (artist?.email) {
        doc.text(artist.email, textX, rightY);
        rightY += 3.5;
      }
      doc.text(artist?.country || 'International', textX, rightY);
      rightY += 5.5;

      // Artwork Title (HeadFont bold)
      doc.setFont(headFont, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(art.title, textX, rightY);
      rightY += 4.5;

      // Medium & Specs (Maitree normal)
      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(68, 68, 68);
      const specs = [art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : ''].filter(Boolean).join(' ');
      doc.text(specs, textX, rightY);
      rightY += 5;

      // Concept Block (Maitree normal)
      const conceptText = art.concept?.trim() || art.description?.trim();
      if (conceptText) {
        doc.setFont(headFont, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text('Concept : ', textX, rightY);

        doc.setFont(bodyFont, 'normal');
        doc.setTextColor(51, 51, 51);
        const conceptLines = doc.splitTextToSize(conceptText, 145);
        doc.text(conceptLines, textX + 14, rightY);
      }

      // Plate Footer Row (Maitree normal)
      doc.setDrawColor(229, 229, 229);
      doc.setLineWidth(0.3);
      doc.line(15, 282, 195, 282);

      doc.setFont(bodyFont, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(119, 119, 119);
      const footerLeft = [plateFooter, art.price ? formatPrice(art.price) : ''].filter(Boolean).join(' • ');
      doc.text(footerLeft, 15, 287);
      doc.text(String(pageNum), 195, 287, { align: 'right' });
    }

    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Error generating vector PDF on server:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
