/**
 * generateAdobeHtml.ts
 * Data-driven HTML generator for Adobe PDF export.
 * Builds clean, minimal HTML directly from exhibition data & template blocks.
 * NO DOM serialization — no Tailwind class explosion — typically < 2MB for 100 pages.
 */
import type { Exhibition, Artwork, User, PeerReviewer } from "@/types/exhibition";
import type { CatalogTemplateConfig, CatalogBlockElement } from "@/types/catalogTemplate";
import { getArtworkCatalogTemplate } from "@/types/catalogTemplate";
import { getOptimizedImageUrl } from "@/lib/imagekit";
import { formatDateRange, formatPrice } from "@/lib/utils";
import { EMBEDDED_FONTS_CSS } from "@/lib/embeddedFonts";

const CATALOG_BASE_CSS = (w: number, h: number, bg: string) => `
${EMBEDDED_FONTS_CSS}

@page { size: ${w}in ${h}in; margin: 0; }
* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  font-kerning: normal !important;
  font-variant-ligatures: common-ligatures !important;
  text-rendering: optimizeLegibility !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
html, body {
  margin: 0;
  padding: 0;
  width: ${w}in;
  background: #fff;
  font-family: 'Sarabun', 'Maitree', sans-serif;
  font-kerning: normal;
}
.page {
  position: relative;
  width: ${w}in; height: ${h}in;
  min-height: ${h}in; max-height: ${h}in;
  overflow: hidden;
  background: ${bg || "#ffffff"};
  page-break-after: always; break-after: page;
  margin: 0; padding: 0; box-sizing: border-box;
}
.page:last-child { page-break-after: avoid; break-after: avoid; }
img { max-width: 100%; display: block; }
`;

function fw(w?: string): number {
  if (w === "light") return 300;
  if (w === "medium") return 500;
  if (w === "semibold") return 600;
  if (w === "bold") return 700;
  if (w === "black") return 900;
  return 400;
}

function ff(f?: string): string {
  if (f === "Sarabun") return "'Sarabun', sans-serif";
  if (f === "Maitree") return "'Maitree', serif";
  if (f === "Cinzel") return "'Cinzel', serif";
  if (f === "Inter") return "'Sarabun', sans-serif";
  if (f === "Prompt") return "'Sarabun', sans-serif";
  if (f === "serif") return "'Maitree', serif";
  if (f === "sans-serif") return "'Sarabun', sans-serif";
  return "'Sarabun', sans-serif";
}




function escHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderBlock(block: CatalogBlockElement, artwork: Artwork, pageNumber: number, exhibitionSlug: string): string {
  const s = block.style || {};
  const pos = `position:absolute;left:${block.xInches}in;top:${block.yInches}in;width:${block.widthInches}in;height:${block.heightInches}in;z-index:${block.zIndex || 1};overflow:hidden;box-sizing:border-box;`;
  const artist = artwork.artist;

  const getImg = (url: string, w: number) =>
    getOptimizedImageUrl(url, { width: Math.round(w * 96), quality: 80 });

  const renderText = (
    content: string,
    defaults: { fontSizePt: number; fontWeight: string | number; color: string; textAlign?: string; lineHeight?: number }
  ) => {
    if (!content) return "";
    const align = s.textAlign || defaults.textAlign || "left";
    const fontSize = s.fontSizePt ? `${s.fontSizePt}pt` : `${defaults.fontSizePt}pt`;
    const weight = s.fontWeight ? fw(s.fontWeight) : (typeof defaults.fontWeight === "number" ? defaults.fontWeight : fw(defaults.fontWeight));
    const color = s.color || defaults.color;
    const fontFamily = ff(s.fontFamily);
    const letterSpacing = s.letterSpacing ? `letter-spacing:${s.letterSpacing};` : "letter-spacing:normal;";
    // Only apply text-transform to titles/labels, never to long concept paragraphs unless explicitly intended
    const textTransform = (block.type !== "concept" && s.textTransform && s.textTransform !== "none") ? `text-transform:${s.textTransform};` : "";
    const textDecor = s.textDecoration && s.textDecoration !== "none" ? `text-decoration:${s.textDecoration};` : "";
    const fontStyle = s.fontStyle && s.fontStyle !== "normal" ? `font-style:${s.fontStyle};` : "";
    const isPreWrap = block.type === "concept" || block.type === "custom_text";
    const whiteSpace = isPreWrap ? "white-space:pre-wrap;" : "white-space:normal;";
    const lineHeight = s.lineHeight || defaults.lineHeight || (isPreWrap ? 1.5 : 1.35);

    return `<div style="${pos}display:block;"><div style="width:100%;text-align:${align};font-family:${fontFamily};font-size:${fontSize};font-weight:${weight};color:${color};line-height:${lineHeight};font-kerning:normal;font-variant-ligatures:common-ligatures;${letterSpacing}${textTransform}${textDecor}${fontStyle}${whiteSpace}">${escHtml(content)}</div></div>`;
  };



  switch (block.type) {
    case "artwork_image": {
      const u = getImg(artwork.imageUrl || "", block.widthInches);
      if (!u) return "";
      const br = s.borderRadius ? `border-radius:${s.borderRadius}px;` : "";
      const bw = s.borderWidth ? `border:${s.borderWidth}px ${s.borderStyle || "solid"} ${s.borderColor || "#ccc"};` : "";
      const bg2 = s.backgroundColor ? `background:${s.backgroundColor};` : "";
      return `<div style="${pos}${bg2}${br}${bw}display:flex;align-items:center;justify-content:center;overflow:hidden;"><img src="${u}" alt="${escHtml(artwork.title || "")}" style="max-width:100%;max-height:100%;width:100%;height:100%;object-fit:${s.objectFit || "contain"};${br}" onerror="this.style.display='none'"/></div>`;
    }
    case "artist_photo": {
      const UNSPLASH = ["unsplash.com/photo-1507003211169", "unsplash.com/photo-1534528741775"];
      const raw = artist?.avatarUrl?.trim() || "";
      const isReal = raw.length > 0 && !UNSPLASH.some(p => raw.includes(p));
      const u = getImg(isReal ? raw : (artwork.imageUrl || ""), block.widthInches);
      if (!u) return "";
      const br = s.borderRadius ? `border-radius:${s.borderRadius}px;` : "";
      return `<div style="${pos}${br}overflow:hidden;"><img src="${u}" alt="${escHtml(artist?.name || "")}" style="width:100%;height:100%;object-fit:${s.objectFit || "cover"};${br}" onerror="this.style.display='none'"/></div>`;
    }
    case "country_flag": {
      const code = (artist?.country || "th").toLowerCase().replace(/\s/g, "");
      const br = s.borderRadius ? `border-radius:${s.borderRadius}px;` : "";
      return `<div style="${pos}overflow:hidden;${br}"><img src="https://flagcdn.com/w40/${code}.png" alt="${escHtml(artist?.country || "")}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'"/></div>`;
    }
    case "artwork_title":
      return renderText(`${s.prefixText || ""}${artwork.title || "Untitled"}${s.suffixText || ""}`, {
        fontSizePt: 13,
        fontWeight: 700,
        color: "#8B1B1B",
      });
    case "artist_name":
      return renderText(`${s.prefixText || ""}${artist?.name || "Artist"}${s.suffixText || ""}`, {
        fontSizePt: 14,
        fontWeight: 600,
        color: "#1A1918",
      });
    case "artist_email":
      if (!artist?.email && s.hideIfEmpty) return "";
      return renderText(`${s.prefixText || ""}${artist?.email || "artist@artvara.gallery"}${s.suffixText || ""}`, {
        fontSizePt: 9,
        fontWeight: 400,
        color: "#666666",
      });
    case "medium":
      if (!artwork.medium && s.hideIfEmpty) return "";
      return renderText(`${s.prefixText || ""}${artwork.medium || ""}${s.suffixText || ""}`, {
        fontSizePt: 10,
        fontWeight: 400,
        color: "#444444",
      });
    case "dimensions":
      if (!artwork.dimensions && s.hideIfEmpty) return "";
      return renderText(`${s.prefixText || ""}${artwork.dimensions || ""}${s.suffixText || ""}`, {
        fontSizePt: 9,
        fontWeight: 400,
        color: "#666666",
      });
    case "year_created":
      if (!artwork.yearCreated && s.hideIfEmpty) return "";
      return renderText(`${s.prefixText || ""}${artwork.yearCreated || ""}${s.suffixText || ""}`, {
        fontSizePt: 9,
        fontWeight: 400,
        color: "#666666",
      });
    case "price":
      if (!artwork.price && s.hideIfEmpty) return "";
      return renderText(`${s.prefixText || ""}${formatPrice(artwork.price)}${s.suffixText || ""}`, {
        fontSizePt: 10,
        fontWeight: 700,
        color: "#8B1B1B",
      });
    case "concept": {
      const cText = artwork.concept || artwork.description || "";
      if (!cText && s.hideIfEmpty) return "";
      return renderText(`${s.prefixText || ""}${cText}${s.suffixText || ""}`, {
        fontSizePt: 8.5,
        fontWeight: 400,
        color: "#555555",
      });
    }

    case "page_number":
      return renderText(`${s.prefixText || ""}${pageNumber}${s.suffixText || ""}`, {
        fontSizePt: 8,
        fontWeight: 400,
        color: "#888888",
        textAlign: "center",
      });
    case "custom_text":
      return renderText(block.customContent || s.prefixText || "", {
        fontSizePt: 10,
        fontWeight: 400,
        color: "#1A1918",
      });
    case "custom_box": {
      const bg2 = s.backgroundColor ? `background:${s.backgroundColor};` : "";
      const br = s.borderRadius ? `border-radius:${s.borderRadius}px;` : "";
      const bw = s.borderWidth ? `border:${s.borderWidth}px ${s.borderStyle || "solid"} ${s.borderColor || "transparent"};` : "";
      return `<div style="${pos}${bg2}${br}${bw}">${escHtml(block.customContent || "")}</div>`;
    }
    case "divider_line":
      return `<div style="${pos}border-top:${s.borderWidth || 1}px solid ${s.borderColor || s.color || "#C5A880"};"></div>`;
    case "qr_code": {
      const qrUrl = `https://art-gallery-4ty.pages.dev/exhibitions/${exhibitionSlug}#art-${artwork.id}`;
      const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=1a1918&margin=0`;
      return `<div style="${pos}"><img src="${qrImg}" alt="QR" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none'"/></div>`;
    }
    case "footer_graphic": {
      const rawFooter = block.customContent || s.imageUrl || "";
      if (!rawFooter) return "";
      const footerImg = rawFooter.startsWith("http") ? rawFooter : getOptimizedImageUrl(rawFooter, { width: 1600, quality: 90 });
      const isFade = s.footerEffect === "gradient_fade";
      const opacity = s.opacity !== undefined ? s.opacity : 1;
      const br = s.borderRadius ? `border-radius:${s.borderRadius}px;` : "";
      const maskStyle = isFade
        ? `-webkit-mask-image:linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0) 100%);mask-image:linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0) 100%);`
        : "";
      return `<div style="${pos}overflow:hidden;display:flex;align-items:flex-end;justify-content:center;opacity:${opacity};${br}${maskStyle}"><img src="${footerImg}" alt="Footer" style="width:100%;height:100%;object-fit:${s.objectFit || "cover"};display:block;" onerror="this.style.display='none'"/></div>`;
    }
    default:
      return "";
  }
}


function renderArtworkPage(artwork: Artwork, template: CatalogTemplateConfig, pageNumber: number, exhibitionSlug: string): string {
  const blocks = (template.blocks || [])
    .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
    .map(b => renderBlock(b, artwork, pageNumber, exhibitionSlug))
    .join("\n");
  const bg = template.backgroundColor || "#ffffff";
  return `<div class="page" style="background:${bg};">\n${blocks}\n</div>`;
}

function renderCoverPage(exhibition: Exhibition, curator: User | null | undefined, coverFooter: string, w: number, h: number, bg: string): string {
  const bannerUrl = getOptimizedImageUrl(exhibition.bannerUrl, { width: 1200, quality: 85 });
  const imgH = (h * 0.48).toFixed(3);
  const pad = (Math.min(w, h) * 0.07875).toFixed(3);
  return `<div class="page" style="background:${bg};padding:${pad}in;display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center;">
  <div style="width:100%;">
    <div style="border-bottom:1px solid #E0E0E0;padding-bottom:6px;margin-bottom:8px;">
      <div style="font-family:'Cinzel','Times New Roman',serif;font-size:22pt;font-weight:700;letter-spacing:0.2em;color:#000;">ARTVARA</div>
      <div style="font-family:'Maitree',Georgia,serif;font-size:7pt;text-transform:uppercase;letter-spacing:0.15em;color:#666;margin-top:2px;">International Art Festival &amp; Curated Exhibition</div>
    </div>
    ${bannerUrl ? `<div style="width:100%;height:${imgH}in;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:8px;"><img src="${bannerUrl}" alt="${escHtml(exhibition.title || "")}" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.style.display='none'"/></div>` : ""}
    <div style="padding-top:4px;">
      <div style="font-family:'Maitree',Georgia,serif;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#333;">Official Exhibition Catalog (สูจิบัตร)</div>
      <div style="font-family:'Cinzel','Times New Roman',serif;font-size:16pt;font-weight:700;color:#000;margin-top:4px;line-height:1.3;">${escHtml(exhibition.title || "")}</div>
      ${curator?.name ? `<div style="font-family:'Maitree',Georgia,serif;font-size:9pt;color:#444;margin-top:3px;">Curated by ${escHtml(curator.name)}</div>` : ""}
      <div style="margin-top:6px;"><span style="font-family:'Maitree',Georgia,serif;font-size:8pt;border:1px solid #C5A880;color:#8C6D3F;font-weight:700;padding:2px 8px;text-transform:uppercase;letter-spacing:0.1em;">${escHtml(formatDateRange(exhibition.startDate, exhibition.endDate))}</span></div>
    </div>
  </div>
  <div style="width:100%;border-top:1px solid #E0E0E0;padding-top:4px;display:flex;justify-content:space-between;font-family:'Maitree',Georgia,serif;font-size:7pt;color:#666;">
    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:90%;">${escHtml(coverFooter)}</span>
    <span style="font-family:monospace;font-weight:700;color:#444;">1</span>
  </div>
</div>`;
}

function renderStatementPage(exhibition: Exhibition, peerReviewersList: PeerReviewer[], plateFooter: string, w: number, h: number, bg: string): string {
  const pad = (Math.min(w, h) * 0.07875).toFixed(3);
  const cards = peerReviewersList.map(r => {
    const avatarUrl = getOptimizedImageUrl(r.avatarUrl, { width: 160, quality: 80 });
    const code = (r.country || "th").toLowerCase().replace(/\s/g, "");
    return `<div style="background:#FAFAFA;border:1px solid #EEE;border-radius:6px;padding:6px;display:flex;gap:6px;align-items:flex-start;">
  ${avatarUrl ? `<img src="${avatarUrl}" alt="${escHtml(r.name || "")}" style="width:36px;height:44px;object-fit:cover;border-radius:3px;flex-shrink:0;" onerror="this.style.display='none'"/>` : `<div style="width:36px;height:44px;background:#EEE;border-radius:3px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9pt;color:#888;">${escHtml((r.name || "P").charAt(0))}</div>`}
  <div style="min-width:0;flex:1;">
    <div style="display:flex;align-items:center;gap:3px;margin-bottom:2px;">
      <img src="https://flagcdn.com/w40/${code}.png" alt="${escHtml(r.country || "")}" style="width:12px;height:8px;object-fit:cover;border:1px solid #D0D0D0;" onerror="this.style.display='none'"/>
      <span style="font-size:7pt;font-weight:700;color:#8C6D3F;text-transform:uppercase;">${escHtml(r.role || "กรรมการผู้ทรงคุณวุฒิ")}</span>
    </div>
    <div style="font-size:8pt;font-weight:700;color:#000;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml([r.academicTitle, r.name].filter(Boolean).join(" "))}</div>
    ${r.currentPosition ? `<div style="font-size:7pt;color:#444;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(r.currentPosition)}</div>` : ""}
    ${r.institution ? `<div style="font-size:6.5pt;color:#777;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(r.institution)}</div>` : ""}
  </div>
</div>`;
  }).join("\n");

  return `<div class="page" style="background:${bg};padding:${pad}in;display:flex;flex-direction:column;justify-content:space-between;">
  <div>
    <div style="border-bottom:1px solid #E0E0E0;padding-bottom:5px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-family:'Cinzel',serif;font-size:14pt;font-weight:700;letter-spacing:0.15em;color:#000;">ARTVARA</span>
      <span style="font-family:'Maitree',serif;font-size:6.5pt;text-transform:uppercase;letter-spacing:0.12em;color:#666;">Academic Accreditation &amp; Curatorial Statement</span>
    </div>
    <div style="margin-bottom:5px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E8E8E8;padding-bottom:3px;">
      <span style="font-family:'Prompt',sans-serif;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#000;">คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Review Committee)</span>
      <span style="font-family:'Maitree',serif;font-size:7pt;color:#666;">${peerReviewersList.length} ท่าน</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">${cards}</div>
  </div>
  <div style="width:100%;border-top:1px solid #E0E0E0;padding-top:4px;display:flex;justify-content:space-between;font-family:'Maitree',serif;font-size:7pt;color:#666;">
    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:90%;">${escHtml(plateFooter)}</span>
    <span style="font-family:monospace;font-weight:700;color:#444;font-size:7.5pt;">2</span>
  </div>
</div>`;
}

export function generateAdobeCatalogHtml(params: {
  exhibition: Exhibition;
  artworks: Artwork[];
  curator: User | null | undefined;
  peerReviewersList: PeerReviewer[];
  coverFooter: string;
  plateFooter: string;
  hasReviewers: boolean;
  template: CatalogTemplateConfig;
}): string {
  const { exhibition, artworks, curator, peerReviewersList, coverFooter, plateFooter, hasReviewers, template } = params;
  const w = template.pageWidthInches || 8.0;
  const h = template.pageHeightInches || 8.0;
  const bg = template.backgroundColor || "#ffffff";
  const slug = exhibition.slug || "";
  const pages: string[] = [];

  pages.push(renderCoverPage(exhibition, curator, coverFooter, w, h, bg));
  if (hasReviewers && peerReviewersList.length > 0) {
    pages.push(renderStatementPage(exhibition, peerReviewersList, plateFooter, w, h, bg));
  }
  artworks.forEach((art, idx) => {
    const pageNum = (hasReviewers ? idx + 2 : idx + 1) + 1;
    const artTemplate = getArtworkCatalogTemplate(exhibition, art.id);
    pages.push(renderArtworkPage(art, artTemplate, pageNum, slug));
  });

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>${escHtml(exhibition.title || "Art Exhibition")}-Adobe-Catalog</title>
<style>${CATALOG_BASE_CSS(w, h, bg)}</style>
</head>
<body>
${pages.join("\n")}
</body>
</html>`;
}

export function generateAdobeSinglePageHtml(params: {
  exhibition: Exhibition;
  artwork?: Artwork | null;
  curator?: User | null;
  peerReviewersList?: PeerReviewer[];
  coverFooter: string;
  plateFooter: string;
  template: CatalogTemplateConfig;
  pageType: 'cover' | 'statement' | 'artwork';
  pageNumber: number;
}): string {
  const { exhibition, artwork, curator, peerReviewersList, coverFooter, plateFooter, template, pageType, pageNumber } = params;
  const w = template.pageWidthInches || 8.0;
  const h = template.pageHeightInches || 8.0;
  const bg = template.backgroundColor || "#ffffff";
  const slug = exhibition.slug || "";

  let pageHtml = "";
  if (pageType === 'cover') {
    pageHtml = renderCoverPage(exhibition, curator, coverFooter, w, h, bg);
  } else if (pageType === 'statement') {
    pageHtml = renderStatementPage(exhibition, peerReviewersList || [], plateFooter, w, h, bg);
  } else if (artwork) {
    const artTemplate = getArtworkCatalogTemplate(exhibition, artwork.id);
    pageHtml = renderArtworkPage(artwork, artTemplate, pageNumber, slug);
  }

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>${escHtml(exhibition.title || "Art Exhibition")}-Page-${pageNumber}</title>
<style>${CATALOG_BASE_CSS(w, h, bg)}</style>
</head>
<body>
${pageHtml}
</body>
</html>`;
}



