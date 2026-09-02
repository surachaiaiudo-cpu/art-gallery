'use client';

import jsPDF from 'jspdf';
import { Exhibition, Artwork, PeerReviewer } from '@/types/exhibition';
import {
  CatalogTemplateConfig,
  CatalogBlockElement,
  getArtworkCatalogTemplate,
  getExhibitionCatalogTemplate,
  getExhibitionPageOverrides,
} from '@/types/catalogTemplate';

/**
 * Helper to fetch an image and convert it to Base64 for pure jsPDF embedding.
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    // Fallback: Try loading via image element + canvas
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.92);
    } catch {
      return null;
    }
  }
}

/**
 * Helper to convert hex color to RGB tuple
 */
function hexToRgb(hex: string): [number, number, number] {
  if (!hex || hex === 'transparent') return [255, 255, 255];
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Draws a single catalog plate into the jsPDF instance using pure vector commands.
 */
export async function renderPlateToPdfDoc(
  doc: jsPDF,
  artwork: Artwork,
  template: CatalogTemplateConfig,
  pageNumber: number,
  exhibitionSlug?: string
): Promise<void> {
  const widthInches = template.pageWidthInches || 8.0;
  const heightInches = template.pageHeightInches || 8.0;

  // Background Fill
  if (template.backgroundColor && template.backgroundColor !== 'transparent') {
    const [r, g, b] = hexToRgb(template.backgroundColor);
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, widthInches, heightInches, 'F');
  }

  const artist = artwork.artist;

  // Render each block element natively
  for (const block of template.blocks) {
    const s = block.style || {};
    const x = block.xInches;
    const y = block.yInches;
    const w = block.widthInches;
    const h = block.heightInches;
    const colorRgb = hexToRgb(s.color || '#1A1918');

    switch (block.type) {
      case 'artwork_image': {
        const rawUrl = artwork.imageUrl || (artwork as any).image;
        if (rawUrl) {
          const imgBase64 = await fetchImageAsBase64(rawUrl);
          if (imgBase64) {
            try {
              doc.addImage(imgBase64, 'JPEG', x, y, w, h, undefined, 'FAST');
            } catch (e) {
              console.warn('Error adding artwork image to PDF:', e);
            }
          }
        }
        break;
      }

      case 'artist_photo': {
        const photoUrl = artist?.avatarUrl || (artist as any)?.photoUrl;
        if (photoUrl) {
          const photoBase64 = await fetchImageAsBase64(photoUrl);
          if (photoBase64) {
            try {
              doc.addImage(photoBase64, 'JPEG', x, y, Math.min(w, h), Math.min(w, h), undefined, 'FAST');
            } catch (e) {
              console.warn('Error adding artist photo to PDF:', e);
            }
          }
        }
        break;
      }

      case 'custom_box': {
        const [bgR, bgG, bgB] = hexToRgb(s.backgroundColor || '#FAF8F5');
        const [bdR, bdG, bdB] = hexToRgb(s.borderColor || '#E6E0D4');
        doc.setFillColor(bgR, bgG, bgB);
        doc.setDrawColor(bdR, bdG, bdB);
        doc.setLineWidth((s.borderWidth || 1) * (1 / 72));
        doc.rect(x, y, w, h, s.backgroundColor && s.backgroundColor !== 'transparent' ? 'FD' : 'D');
        break;
      }

      case 'divider_line': {
        const [lineR, lineG, lineB] = hexToRgb(s.borderColor || '#8B1B1B');
        doc.setDrawColor(lineR, lineG, lineB);
        doc.setLineWidth((s.borderWidth || 1) * (1 / 72));
        doc.line(x, y, x + w, y);
        break;
      }

      case 'artwork_title': {
        const text = artwork.title || 'Untitled';
        doc.setFontSize(s.fontSizePt || 14);
        doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
        doc.text(text, x, y + 0.15, { maxWidth: w });
        break;
      }

      case 'artist_name': {
        const text = artist?.name || 'Artist';
        doc.setFontSize(s.fontSizePt || 11);
        doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
        doc.text(text, x, y + 0.12, { maxWidth: w });
        break;
      }

      case 'artist_email': {
        const text = artist?.email || '';
        if (text) {
          doc.setFontSize(s.fontSizePt || 8.5);
          doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
          doc.text(text, x, y + 0.1, { maxWidth: w });
        }
        break;
      }

      case 'medium': {
        const text = artwork.medium ? `เทคนิค: ${artwork.medium}` : '';
        if (text) {
          doc.setFontSize(s.fontSizePt || 9);
          doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
          doc.text(text, x, y + 0.1, { maxWidth: w });
        }
        break;
      }

      case 'dimensions': {
        const text = artwork.dimensions ? `ขนาด: ${artwork.dimensions}` : '';
        if (text) {
          doc.setFontSize(s.fontSizePt || 9);
          doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
          doc.text(text, x, y + 0.1, { maxWidth: w });
        }
        break;
      }

      case 'year_created': {
        const text = artwork.yearCreated ? `ปีที่สร้าง: ${artwork.yearCreated}` : '';
        if (text) {
          doc.setFontSize(s.fontSizePt || 9);
          doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
          doc.text(text, x, y + 0.1, { maxWidth: w });
        }
        break;
      }

      case 'price': {
        const text = artwork.price ? `ราคา: ฿${Number(artwork.price).toLocaleString()}` : '';
        if (text) {
          doc.setFontSize(s.fontSizePt || 9);
          doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
          doc.text(text, x, y + 0.1, { maxWidth: w });
        }
        break;
      }

      case 'concept': {
        const text = artwork.concept ? `แนวคิด: ${artwork.concept}` : '';
        if (text) {
          doc.setFontSize(s.fontSizePt || 8.5);
          doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
          doc.text(text, x, y + 0.1, { maxWidth: w, align: s.textAlign || 'left' });
        }
        break;
      }

      case 'custom_text': {
        const text = (block as any).content || (block as any).customText || '';
        if (text) {
          doc.setFontSize(s.fontSizePt || 9);
          doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
          doc.text(text, x, y + 0.1, { maxWidth: w, align: s.textAlign || 'left' });
        }
        break;
      }

      case 'page_number': {
        doc.setFontSize(s.fontSizePt || 8);
        doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
        doc.text(String(pageNumber), x, y + 0.1);
        break;
      }

      case 'qr_code': {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
          `https://art-gallery-4ty.pages.dev/exhibitions/${exhibitionSlug || ''}#art-${artwork.id}`
        )}&bgcolor=ffffff&color=1a1918&margin=0`;
        const qrBase64 = await fetchImageAsBase64(qrUrl);
        if (qrBase64) {
          try {
            doc.addImage(qrBase64, 'PNG', x, y, Math.min(w, h), Math.min(w, h), undefined, 'FAST');
          } catch (e) {
            console.warn('Error adding QR code to PDF:', e);
          }
        }
        break;
      }

      default:
        break;
    }
  }
}

/**
 * 💾 Export a single plate directly to a pure Vector PDF file downloaded straight to disk.
 */
export async function exportSinglePlateToVectorPDF(
  artwork: Artwork,
  template: CatalogTemplateConfig,
  exhibitionSlug = 'catalog',
  pageNumber = 1
): Promise<void> {
  const widthInches = template.pageWidthInches || 8.0;
  const heightInches = template.pageHeightInches || 8.0;

  const doc = new jsPDF({
    orientation: widthInches > heightInches ? 'landscape' : 'portrait',
    unit: 'in',
    format: [widthInches, heightInches],
    compress: true,
  });

  await renderPlateToPdfDoc(doc, artwork, template, pageNumber, exhibitionSlug);

  const cleanTitle = (artwork.title || 'plate').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
  doc.save(`${exhibitionSlug}-${cleanTitle}-${widthInches}x${heightInches}.pdf`);
}

/**
 * 📚 Export the entire multi-page exhibition catalog directly to a pure Vector PDF file.
 */
export async function exportFullCatalogToVectorPDF(
  exhibition: Exhibition,
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<void> {
  const masterTemplate = getExhibitionCatalogTemplate(exhibition);
  const widthInches = masterTemplate.pageWidthInches || 8.0;
  const heightInches = masterTemplate.pageHeightInches || 8.0;
  const artworks = exhibition.artworks || [];
  const total = artworks.length + 1;

  const doc = new jsPDF({
    orientation: widthInches > heightInches ? 'landscape' : 'portrait',
    unit: 'in',
    format: [widthInches, heightInches],
    compress: true,
  });

  // Page 1: Cover Page
  if (onProgress) onProgress('กำลังสร้างหน้าปกสูจิบัตร (Cover Page)...', 1, total);
  const [bgR, bgG, bgB] = hexToRgb(masterTemplate.backgroundColor || '#FAF8F5');
  doc.setFillColor(bgR, bgG, bgB);
  doc.rect(0, 0, widthInches, heightInches, 'F');

  // Cover Banner Image
  if (exhibition.bannerUrl) {
    const bannerBase64 = await fetchImageAsBase64(exhibition.bannerUrl);
    if (bannerBase64) {
      try {
        doc.addImage(bannerBase64, 'JPEG', 0.5, 0.5, widthInches - 1, heightInches * 0.5, undefined, 'FAST');
      } catch {}
    }
  }

  // Cover Title
  doc.setFontSize(18);
  doc.setTextColor(139, 27, 27);
  doc.text(exhibition.title || 'Exhibition Catalog', 0.5, heightInches * 0.62, { maxWidth: widthInches - 1 });

  // Cover Curator
  if (exhibition.curator?.name) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`ภัณฑารักษ์: ${exhibition.curator.name}`, 0.5, heightInches * 0.72);
  }

  // Cover Gallery Tag
  doc.setFontSize(8.5);
  doc.setTextColor(139, 27, 27);
  doc.text('POH-CHANG ACADEMY OF ARTS • ARTVARA GALLERY', 0.5, heightInches - 0.5);

  // Subsequent Artwork Pages
  for (let idx = 0; idx < artworks.length; idx++) {
    const art = artworks[idx];
    const pageNum = idx + 2;
    if (onProgress) onProgress(`กำลังสร้างหน้าผลงานที่ ${idx + 1}/${artworks.length}: «${art.title}»`, idx + 2, total);

    doc.addPage([widthInches, heightInches], widthInches > heightInches ? 'landscape' : 'portrait');

    const artTemplate = getArtworkCatalogTemplate(exhibition, art.id);
    await renderPlateToPdfDoc(doc, art, artTemplate, pageNum, exhibition.slug);
  }

  if (onProgress) onProgress('สร้างเอกสาร PDF เสร็จสมบูรณ์ กำลังดาวน์โหลด...', total, total);
  const slug = exhibition.slug || 'catalog';
  doc.save(`${slug}-Official-Catalog-${widthInches}x${heightInches}.pdf`);
}
