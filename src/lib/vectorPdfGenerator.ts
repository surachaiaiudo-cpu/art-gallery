import { jsPDF } from 'jspdf';
import { Exhibition, PeerReviewer, getCatalogFooterText, getCatalogPlateFooterText, getExhibitionPeerReviewers } from '@/types/exhibition';
import { formatDateRange, formatPrice } from '@/lib/utils';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';

// Helper to convert Image URL to Base64 data URI
async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error fetching image for PDF:', imageUrl, err);
    return null;
  }
}

// Helper to fetch font as Base64
async function getFontBase64(fontUrl: string): Promise<string | null> {
  try {
    const res = await fetch(fontUrl);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    // Convert arrayBuffer to Base64 in browser or node
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error('Error fetching font:', fontUrl, err);
    return null;
  }
}

export interface GenerateVectorPDFOptions {
  exhibition: Exhibition;
  coverFooterText?: string;
  plateFooterText?: string;
  peerReviewers?: PeerReviewer[];
  standard?: 'standard' | 'pdfx';
  onProgress?: (current: number, total: number) => void;
}

export async function generateEmbeddedVectorPDF({
  exhibition,
  coverFooterText,
  plateFooterText,
  peerReviewers,
  standard = 'standard',
  onProgress,
}: GenerateVectorPDFOptions): Promise<jsPDF> {
  const isPdfX = standard === 'pdfx';
  const coverFooter = coverFooterText || getCatalogFooterText(exhibition);
  const plateFooter = plateFooterText || getCatalogPlateFooterText(exhibition);
  const reviewers = peerReviewers || getExhibitionPeerReviewers(exhibition);
  const hasReviewers = reviewers.length > 0;
  const artworks = exhibition.artworks || [];
  const curator = exhibition.curator;

  const totalPages = 1 + (hasReviewers ? 1 : 0) + artworks.length;

  // Initialize jsPDF (A4: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: !isPdfX,
  });

  // 1. Fetch & Embed TrueType Vector Fonts (Sarabun Regular & Bold)
  try {
    const [regularFontB64, boldFontB64] = await Promise.all([
      getFontBase64('https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf'),
      getFontBase64('https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Bold.ttf'),
    ]);

    if (regularFontB64) {
      doc.addFileToVFS('Sarabun-Regular.ttf', regularFontB64);
      doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
    }
    if (boldFontB64) {
      doc.addFileToVFS('Sarabun-Bold.ttf', boldFontB64);
      doc.addFont('Sarabun-Bold.ttf', 'Sarabun', 'bold');
    }
  } catch (err) {
    console.error('Error embedding vector fonts into jsPDF:', err);
  }

  // Set ISO Document Properties
  doc.setProperties({
    title: `${exhibition.title} - Official Exhibition Catalog`,
    subject: isPdfX
      ? 'PDF/X-1a:2001 ISO 15930-1 Prepress Commercial Print-Ready Vector Catalog'
      : 'Standard Digital Vector Catalog',
    author: curator?.name || 'ARTVARA Curatorial Team',
    keywords: 'ARTVARA, Exhibition Catalog, Vector Typography, Embedded TrueType Fonts, ISO 15930-1',
    creator: 'ARTVARA High-Fidelity Vector Catalog Generator (Embedded Font Engine)',
  });

  let currentPage = 1;
  onProgress?.(currentPage, totalPages);

  // Default font
  const primaryFont = 'Sarabun';

  // -------------------------------------------------------------
  // PAGE 1: COVER PAGE
  // -------------------------------------------------------------
  doc.setFont(primaryFont, 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text('ARTVARA', 105, 22, { align: 'center' });

  doc.setFont(primaryFont, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);
  doc.text('INTERNATIONAL ART FESTIVAL & CURATED EXHIBITION', 105, 27, { align: 'center' });

  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(0.3);
  doc.line(15, 31, 195, 31);

  // Banner image
  let yPos = 36;
  if (exhibition.bannerUrl) {
    const bannerB64 = await getBase64ImageFromUrl(exhibition.bannerUrl);
    if (bannerB64) {
      try {
        doc.addImage(bannerB64, 'JPEG', 20, yPos, 170, 135, undefined, 'FAST');
      } catch (err) {
        console.error('Error adding banner image to PDF:', err);
      }
    }
    yPos += 142;
  } else {
    yPos += 40;
  }

  // Cover Titles
  doc.setFont(primaryFont, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 51, 51);
  doc.text('OFFICIAL EXHIBITION CATALOG (สูจิบัตร)', 105, yPos, { align: 'center' });
  yPos += 8;

  doc.setFont(primaryFont, 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  const titleLines = doc.splitTextToSize(exhibition.title, 170);
  doc.text(titleLines, 105, yPos, { align: 'center' });
  yPos += titleLines.length * 8 + 2;

  if (curator?.name) {
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(68, 68, 68);
    doc.text(`Curated by: ${curator.name}`, 105, yPos, { align: 'center' });
    yPos += 6;
  }

  if (hasReviewers) {
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(85, 85, 85);
    const revText = `Peer Review Committee: ${reviewers.map(r => [r.academicTitle, r.name].filter(Boolean).join(' ')).join(' • ')}`;
    const revLines = doc.splitTextToSize(revText, 170);
    doc.text(revLines, 105, yPos, { align: 'center' });
    yPos += revLines.length * 4.5 + 2;
  }

  doc.setFont(primaryFont, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text(formatDateRange(exhibition.startDate, exhibition.endDate), 105, yPos, { align: 'center' });

  // Cover Footer
  doc.setDrawColor(224, 224, 224);
  doc.line(15, 280, 195, 280);
  doc.setFont(primaryFont, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);
  doc.text(coverFooter, 105, 286, { align: 'center' });

  // -------------------------------------------------------------
  // PAGE 2: PEER REVIEW COMMITTEE & CURATORIAL STATEMENT
  // -------------------------------------------------------------
  if (hasReviewers) {
    currentPage++;
    onProgress?.(currentPage, totalPages);
    doc.addPage('a4', 'portrait');

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('ARTVARA', 15, 22);

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(102, 102, 102);
    doc.text('ACADEMIC PEER REVIEW BOARD & CURATORIAL STATEMENT', 15, 27);

    doc.setDrawColor(224, 224, 224);
    doc.line(15, 30, 195, 30);

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Review Committee)', 15, 38);

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.text('รายนามคณะกรรมการผู้ทรงคุณวุฒิในการพิจารณาและประเมินผลงานศิลปกรรมในนิทรรศการ', 15, 43);

    let cardY = 48;
    for (let i = 0; i < reviewers.length; i++) {
      const rev = reviewers[i];
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(232, 232, 232);
      doc.roundedRect(15, cardY, 180, 16, 1.5, 1.5, 'FD');

      // Avatar
      if (rev.avatarUrl) {
        const avB64 = await getBase64ImageFromUrl(rev.avatarUrl);
        if (avB64) {
          try {
            doc.addImage(avB64, 'JPEG', 17, cardY + 2, 10, 12);
          } catch (e) {}
        }
      } else {
        doc.setFillColor(239, 239, 239);
        doc.rect(17, cardY + 2, 10, 12, 'F');
        doc.setFont(primaryFont, 'bold');
        doc.setFontSize(9);
        doc.setTextColor(68, 68, 68);
        doc.text(rev.name?.trim().charAt(0).toUpperCase() || 'R', 22, cardY + 9.5, { align: 'center' });
      }

      // Role & Name
      doc.setFont(primaryFont, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      const roleText = rev.role || (i === 0 ? 'ประธานกรรมการ' : 'กรรมการผู้ทรงคุณวุฒิ');
      const fullName = [rev.academicTitle, rev.name].filter(Boolean).join(' ');
      doc.text(`[${roleText}]  ${fullName}`, 30, cardY + 7);

      // Institution
      if (rev.institution) {
        doc.setFont(primaryFont, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(85, 85, 85);
        doc.text(rev.institution, 30, cardY + 12);
      }

      // Country
      if (rev.country) {
        doc.setFont(primaryFont, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(119, 119, 119);
        doc.text(rev.country, 190, cardY + 9.5, { align: 'right' });
      }

      cardY += 19;
    }

    // Curatorial Statement
    if (exhibition.curatorNote) {
      cardY += 4;
      doc.setDrawColor(232, 232, 232);
      doc.line(15, cardY, 195, cardY);
      cardY += 6;

      doc.setFont(primaryFont, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('คำนำภัณฑารักษ์ (Curatorial Statement)', 15, cardY);
      cardY += 6;

      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 51, 51);
      const noteLines = doc.splitTextToSize(`"${exhibition.curatorNote}"`, 180);
      doc.text(noteLines, 15, cardY);
      cardY += noteLines.length * 4.5;

      if (curator?.name) {
        doc.setFont(primaryFont, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(`— ${curator.name} (Curator)`, 195, cardY + 2, { align: 'right' });
      }
    }

    // Page 2 Footer
    doc.setDrawColor(229, 229, 229);
    doc.line(15, 282, 195, 282);
    doc.setFont(primaryFont, 'normal');
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

    currentPage++;
    onProgress?.(currentPage, totalPages);
    doc.addPage('a4', 'portrait');

    // 1. Artwork Image (Top to 8-inch boundary: height 175mm, width 180mm)
    if (art.imageUrl) {
      const artB64 = await getBase64ImageFromUrl(art.imageUrl);
      if (artB64) {
        try {
          doc.addImage(artB64, 'JPEG', 15, 15, 180, 175, undefined, 'FAST');
        } catch (e) {
          console.error('Error rendering artwork image in PDF:', e);
        }
      }
    }

    // 2. Details Section (Starts at 196mm from top)
    const detailY = 196;

    // Left Column: Flag (above) and Artist Photo (below)
    const flagUrl = getFlagImageUrl(artist?.country);
    if (flagUrl) {
      const flagB64 = await getBase64ImageFromUrl(flagUrl);
      if (flagB64) {
        try {
          doc.addImage(flagB64, 'PNG', 15, detailY, 12, 7);
        } catch (e) {}
      }
    }

    const hasRealPhoto =
      artist?.avatarUrl &&
      !artist.avatarUrl.includes('unsplash.com/photo-1507003211169') &&
      !artist.avatarUrl.includes('unsplash.com/photo-1534528741775');

    if (hasRealPhoto) {
      const photoB64 = await getBase64ImageFromUrl(artist!.avatarUrl!);
      if (photoB64) {
        try {
          doc.addImage(photoB64, 'JPEG', 15, detailY + 9, 20, 24);
        } catch (e) {}
      }
    } else {
      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(208, 208, 208);
      doc.roundedRect(15, detailY + 9, 20, 24, 1.5, 1.5, 'FD');
      doc.setFont(primaryFont, 'bold');
      doc.setFontSize(14);
      doc.setTextColor(51, 51, 51);
      doc.text(artist?.name?.trim().charAt(0).toUpperCase() || 'A', 25, detailY + 24, { align: 'center' });
    }

    // Right Column: Vector Text
    const textX = 40;
    let rightY = detailY + 2;

    // Artist Name
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(artist?.name || 'Artist', textX, rightY);
    rightY += 4.5;

    // Email & Country
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(102, 102, 102);
    if (artist?.email) {
      doc.text(artist.email, textX, rightY);
      rightY += 3.5;
    }
    doc.text(artist?.country || 'International', textX, rightY);
    rightY += 5.5;

    // Artwork Title
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(art.title, textX, rightY);
    rightY += 4.5;

    // Medium & Specs
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(68, 68, 68);
    const specs = [art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : ''].filter(Boolean).join(' ');
    doc.text(specs, textX, rightY);
    rightY += 5;

    // Concept Block
    const conceptText = art.concept?.trim() || art.description?.trim();
    if (conceptText) {
      doc.setFont(primaryFont, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('Concept : ', textX, rightY);

      doc.setFont(primaryFont, 'normal');
      doc.setTextColor(51, 51, 51);
      const conceptLines = doc.splitTextToSize(conceptText, 155);
      doc.text(conceptLines, textX + 13, rightY);
    }

    // Bottom SVG Ribbon Graphic
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.lines(
      [
        [30, -5],
        [40, 6],
        [50, -4],
        [60, 3],
      ],
      15,
      274,
      [1, 1],
      'S',
      false
    );

    // Plate Footer Row
    doc.setDrawColor(229, 229, 229);
    doc.setLineWidth(0.3);
    doc.line(15, 282, 195, 282);

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(119, 119, 119);
    const footerLeft = [plateFooter, art.price ? formatPrice(art.price) : ''].filter(Boolean).join(' • ');
    doc.text(footerLeft, 15, 287);
    doc.text(String(pageNum), 195, 287, { align: 'right' });
  }

  return doc;
}
