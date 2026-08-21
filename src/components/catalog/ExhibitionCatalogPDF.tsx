import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image as PdfImage,
  StyleSheet,
  Font,
  Svg,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from '@react-pdf/renderer';
import { Exhibition, PeerReviewer, getCatalogFooterText, getCatalogPlateFooterText, getExhibitionPeerReviewers } from '@/types/exhibition';
import { formatDateRange, formatPrice } from '@/lib/utils';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';

// Register Sukhumvit / Prompt for Headings
Font.register({
  family: 'HeadFont',
  fonts: [
    { src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/prompt/Prompt-Regular.ttf', fontWeight: 'normal' },
    { src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/prompt/Prompt-Bold.ttf', fontWeight: 'bold' },
  ],
});

// Register Maitree for Content & Body
Font.register({
  family: 'Maitree',
  fonts: [
    { src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/maitree/Maitree-Regular.ttf', fontWeight: 'normal' },
    { src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/maitree/Maitree-Bold.ttf', fontWeight: 'bold' },
  ],
});

// Helper to normalize Thai text Unicode encoding for perfect diacritic alignment
function cleanThaiText(text?: string | null): string {
  if (!text) return '';
  return String(text).normalize('NFC');
}

// A4 Dimensions: 210mm x 297mm (595.28pt x 841.89pt in 72 DPI PDF coordinates)
const styles = StyleSheet.create({
  page: {
    width: '100%',
    height: '100%',
    paddingTop: '15mm',
    paddingBottom: '15mm',
    paddingLeft: '15mm',
    paddingRight: '15mm',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Maitree',
    color: '#000000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  // Header
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  headerLogo: {
    fontFamily: 'HeadFont',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#000000',
  },
  headerSub: {
    fontFamily: 'Maitree',
    fontSize: 8,
    color: '#666666',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  // Cover Page
  coverBannerContainer: {
    width: '100%',
    height: 360,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBanner: {
    maxHeight: '100%',
    maxWidth: '100%',
    objectFit: 'contain',
  },
  coverContent: {
    textAlign: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  catalogBadge: {
    fontFamily: 'HeadFont',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: '#333333',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  coverTitle: {
    fontFamily: 'HeadFont',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 1.3,
  },
  curatorText: {
    fontFamily: 'Maitree',
    fontSize: 10,
    color: '#444444',
    marginBottom: 4,
  },
  curatorHighlight: {
    fontFamily: 'HeadFont',
    fontWeight: 'bold',
    color: '#000000',
  },
  peerReviewCoverText: {
    fontFamily: 'Maitree',
    fontSize: 8.5,
    color: '#555555',
    marginBottom: 4,
    textAlign: 'center',
  },
  dateText: {
    fontFamily: 'Maitree',
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
  },
  coverFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 10,
    textAlign: 'center',
  },
  coverFooterText: {
    fontFamily: 'Maitree',
    fontSize: 8,
    color: '#666666',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Page 2: Peer Reviewers & Statement
  page2Content: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'HeadFont',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    color: '#000000',
    marginBottom: 3,
  },
  sectionSub: {
    fontFamily: 'Maitree',
    fontSize: 8,
    color: '#666666',
    marginBottom: 10,
  },
  reviewerCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewerLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  reviewerAvatar: {
    width: 32,
    height: 38,
    borderRadius: 3,
    objectFit: 'cover',
    backgroundColor: '#E0E0E0',
  },
  reviewerInitialBox: {
    width: 32,
    height: 38,
    borderRadius: 3,
    backgroundColor: '#EFEFEF',
    borderWidth: 1,
    borderColor: '#DCDCDC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitialText: {
    fontFamily: 'HeadFont',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#444444',
  },
  reviewerRoleBadge: {
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 2,
    fontSize: 7.5,
    fontFamily: 'HeadFont',
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 4,
  },
  reviewerName: {
    fontFamily: 'HeadFont',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
  },
  reviewerInstitution: {
    fontFamily: 'Maitree',
    fontSize: 8,
    color: '#555555',
    marginTop: 1,
  },
  reviewerCountry: {
    fontFamily: 'Maitree',
    fontSize: 8,
    color: '#777777',
  },
  statementContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 10,
    marginTop: 8,
  },
  statementQuote: {
    fontFamily: 'Maitree',
    fontSize: 8.5,
    color: '#333333',
    lineHeight: 1.6,
  },
  statementAuthor: {
    fontFamily: 'HeadFont',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
    marginTop: 6,
  },

  // Artwork Pages (Pages 3+)
  artworkImageContainer: {
    width: '100%',
    height: 480, // Exactly 8 inches boundary (~170mm)
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  artworkImage: {
    maxHeight: '100%',
    maxWidth: '100%',
    objectFit: 'contain',
  },
  artworkDetailSection: {
    display: 'flex',
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 10,
  },
  artistLeftCol: {
    width: 60,
    alignItems: 'flex-start',
  },
  flagImage: {
    width: 26,
    height: 15,
    borderRadius: 1.5,
    borderWidth: 0.5,
    borderColor: '#D0D0D0',
    marginBottom: 6,
    objectFit: 'cover',
  },
  artistPhoto: {
    width: 58,
    height: 70,
    borderRadius: 4,
    objectFit: 'cover',
    backgroundColor: '#1A1A1A',
  },
  artistInitialBox: {
    width: 58,
    height: 70,
    borderRadius: 4,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInitialText: {
    fontFamily: 'HeadFont',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  artworkRightCol: {
    flex: 1,
  },
  artistName: {
    fontFamily: 'HeadFont',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  artistEmail: {
    fontFamily: 'Maitree',
    fontSize: 7.5,
    color: '#666666',
    marginTop: 1,
  },
  artistCountry: {
    fontFamily: 'Maitree',
    fontSize: 7.5,
    color: '#666666',
    marginBottom: 4,
  },
  artTitle: {
    fontFamily: 'HeadFont',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 2,
  },
  artSpecs: {
    fontFamily: 'Maitree',
    fontSize: 8,
    color: '#444444',
    marginTop: 1,
  },
  conceptContainer: {
    marginTop: 4,
    paddingTop: 2,
  },
  conceptLabel: {
    fontFamily: 'HeadFont',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000000',
  },
  conceptText: {
    fontFamily: 'Maitree',
    fontSize: 8,
    color: '#333333',
    lineHeight: 1.4,
  },

  // Bottom Footer
  plateFooterRow: {
    borderTopWidth: 0.8,
    borderTopColor: '#E5E5E5',
    paddingTop: 6,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },
  footerText: {
    fontFamily: 'Maitree',
    fontSize: 7.5,
    color: '#777777',
  },
  footerPageNum: {
    fontFamily: 'HeadFont',
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#555555',
  },
  // Wave ribbon decoration
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 1,
    opacity: 0.35,
  },
});

interface ExhibitionCatalogPDFProps {
  exhibition: Exhibition;
  coverFooterText?: string;
  plateFooterText?: string;
  peerReviewers?: PeerReviewer[];
  standard?: 'standard' | 'pdfx';
}

export function ExhibitionCatalogPDF({
  exhibition,
  coverFooterText,
  plateFooterText,
  peerReviewers,
  standard = 'standard',
  footerGraphicType = 'wave_gold',
  customFooterImageUrl,
}: ExhibitionCatalogPDFProps & {
  footerGraphicType?: 'wave_gold' | 'wave_mono' | 'line_gold' | 'custom_image' | 'none';
  customFooterImageUrl?: string;
}) {
  const isPdfX = standard === 'pdfx';
  const coverFooter = cleanThaiText(coverFooterText || getCatalogFooterText(exhibition));
  const plateFooter = cleanThaiText(plateFooterText || getCatalogPlateFooterText(exhibition));
  const reviewers = peerReviewers || getExhibitionPeerReviewers(exhibition);
  const hasReviewers = reviewers.length > 0;
  const artworks = exhibition.artworks || [];
  const curator = exhibition.curator;

  return (
    <Document
      title={`${exhibition.title} - Official Exhibition Catalog`}
      author={curator?.name || 'ARTVARA Curatorial Team'}
      subject={
        isPdfX
          ? 'PDF/X-1a:2001 ISO 15930-1 Prepress Commercial Print-Ready Vector Catalog'
          : 'Standard Digital Vector Catalog'
      }
      keywords="ARTVARA, Exhibition Catalog, Vector Typography, Sukhumvit, Maitree, ISO 15930-1"
      creator="ARTVARA High-Fidelity Vector Catalog Generator"
    >
      {/* ------------------------------------------------------------- */}
      {/* PAGE 1: COVER PAGE */}
      {/* ------------------------------------------------------------- */}
      <Page size="A4" style={styles.page}>
        <View>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerLogo}>ARTVARA</Text>
            <Text style={styles.headerSub}>International Art Festival & Curated Exhibition</Text>
          </View>

          {/* Banner */}
          {exhibition.bannerUrl && (
            <View style={styles.coverBannerContainer}>
              <PdfImage src={exhibition.bannerUrl} style={styles.coverBanner} />
            </View>
          )}

          {/* Titles */}
          <View style={styles.coverContent}>
            <Text style={styles.catalogBadge}>Official Exhibition Catalog (สูจิบัตร)</Text>
            <Text style={styles.coverTitle}>{cleanThaiText(exhibition.title)}</Text>

            {curator?.name && (
              <Text style={styles.curatorText}>
                Curated by: <Text style={styles.curatorHighlight}>{cleanThaiText(curator.name)}</Text>
              </Text>
            )}

            {hasReviewers && (
              <Text style={styles.peerReviewCoverText}>
                Peer Review Committee:{' '}
                <Text style={styles.curatorHighlight}>
                  {reviewers.map((r) => [r.academicTitle, r.name].filter(Boolean).join(' ')).join(' • ')}
                </Text>
              </Text>
            )}

            <Text style={styles.dateText}>
              {formatDateRange(exhibition.startDate, exhibition.endDate)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.coverFooter}>
          <Text style={styles.coverFooterText}>{coverFooter}</Text>
        </View>
      </Page>

      {/* ------------------------------------------------------------- */}
      {/* PAGE 2: PEER REVIEW COMMITTEE & CURATORIAL STATEMENT */}
      {/* ------------------------------------------------------------- */}
      {hasReviewers && (
        <Page size="A4" style={styles.page}>
          <View style={styles.page2Content}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.headerLogo}>ARTVARA</Text>
              <Text style={styles.headerSub}>Academic Peer Review Board & Curatorial Statement</Text>
            </View>

            {/* Reviewers List */}
            <Text style={styles.sectionTitle}>
              คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Review Committee)
            </Text>
            <Text style={styles.sectionSub}>
              รายนามคณะกรรมการผู้ทรงคุณวุฒิในการพิจารณาและประเมินผลงานศิลปกรรมในนิทรรศการ
            </Text>

            {reviewers.map((reviewer, idx) => (
              <View key={idx} style={styles.reviewerCard}>
                <View style={styles.reviewerLeft}>
                  {reviewer.avatarUrl ? (
                    <PdfImage src={reviewer.avatarUrl} style={styles.reviewerAvatar} />
                  ) : (
                    <View style={styles.reviewerInitialBox}>
                      <Text style={styles.reviewerInitialText}>
                        {reviewer.name?.trim().charAt(0).toUpperCase() || 'R'}
                      </Text>
                    </View>
                  )}

                  <View>
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.reviewerRoleBadge}>
                        {reviewer.role || (idx === 0 ? 'ประธานกรรมการ' : 'กรรมการผู้ทรงคุณวุฒิ')}
                      </Text>
                      <Text style={styles.reviewerName}>
                        {cleanThaiText([reviewer.academicTitle, reviewer.name].filter(Boolean).join(' '))}
                      </Text>
                    </View>
                    {reviewer.institution && (
                      <Text style={styles.reviewerInstitution}>{cleanThaiText(reviewer.institution)}</Text>
                    )}
                  </View>
                </View>

                {reviewer.country && (
                  <Text style={styles.reviewerCountry}>{cleanThaiText(reviewer.country)}</Text>
                )}
              </View>
            ))}

            {/* Curatorial Statement */}
            {exhibition.curatorNote && (
              <View style={styles.statementContainer}>
                <Text style={styles.sectionTitle}>คำนำภัณฑารักษ์ (Curatorial Statement)</Text>
                <Text style={styles.statementQuote}>"{cleanThaiText(exhibition.curatorNote)}"</Text>
                {curator?.name && (
                  <Text style={styles.statementAuthor}>— {cleanThaiText(curator.name)} (Curator)</Text>
                )}
              </View>
            )}
          </View>

          {/* Page 2 Footer */}
          <View style={styles.plateFooterRow}>
            <Text style={styles.footerText}>
              {plateFooter || 'Editorial & Academic Accreditation Board'}
            </Text>
            <Text style={styles.footerPageNum}>2</Text>
          </View>
        </Page>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PAGES 3+: ARTWORK PLATES */}
      {/* ------------------------------------------------------------- */}
      {artworks.map((art, idx) => {
        const artist = art.artist;
        const pageNum = hasReviewers ? idx + 3 : idx + 2;
        const flagUrl = getFlagImageUrl(artist?.country);
        const hasRealPhoto =
          artist?.avatarUrl &&
          !artist.avatarUrl.includes('unsplash.com/photo-1507003211169') &&
          !artist.avatarUrl.includes('unsplash.com/photo-1534528741775');
        const concept = cleanThaiText(art.concept?.trim() || art.description?.trim());

        return (
          <Page key={art.id} size="A4" style={styles.page}>
            <View>
              {/* Artwork Image (8 Inches Boundary) */}
              <View style={styles.artworkImageContainer}>
                {art.imageUrl && <PdfImage src={art.imageUrl} style={styles.artworkImage} />}
              </View>

              {/* Details Row */}
              <View style={styles.artworkDetailSection}>
                {/* Left Col: Flag + Photo */}
                <View style={styles.artistLeftCol}>
                  {flagUrl && <PdfImage src={flagUrl} style={styles.flagImage} />}
                  {hasRealPhoto ? (
                    <PdfImage src={artist!.avatarUrl!} style={styles.artistPhoto} />
                  ) : (
                    <View style={styles.artistInitialBox}>
                      <Text style={styles.artistInitialText}>
                        {artist?.name?.trim().charAt(0).toUpperCase() || 'A'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Right Col: Vector Typography Details */}
                <View style={styles.artworkRightCol}>
                  <Text style={styles.artistName}>{cleanThaiText(artist?.name || 'Artist')}</Text>
                  {artist?.email && <Text style={styles.artistEmail}>{artist.email}</Text>}
                  <Text style={styles.artistCountry}>{cleanThaiText(artist?.country || 'International')}</Text>

                  <Text style={styles.artTitle}>{cleanThaiText(art.title)}</Text>
                  <Text style={styles.artSpecs}>
                    {cleanThaiText(
                      [art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : '']
                        .filter(Boolean)
                        .join(' ')
                    )}
                  </Text>

                  {concept && (
                    <View style={styles.conceptContainer}>
                      <Text style={styles.conceptText}>
                        <Text style={styles.conceptLabel}>Concept : </Text>
                        {concept}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Bottom Footer Graphic / Custom Banner */}
            {footerGraphicType === 'custom_image' && customFooterImageUrl ? (
              <View style={styles.waveContainer}>
                <PdfImage src={customFooterImageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </View>
            ) : footerGraphicType === 'wave_mono' ? (
              <View style={styles.waveContainer}>
                <Svg viewBox="0 0 600 120" style={{ width: '100%', height: '100%' }}>
                  <Defs>
                    <LinearGradient id="gMono" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0%" stopColor="#444444" stopOpacity={0.25} />
                      <Stop offset="100%" stopColor="#111111" stopOpacity={0.1} />
                    </LinearGradient>
                  </Defs>
                  <Path d="M-30,120 C120,40 260,130 380,60 C480,0 560,90 630,30 L630,120 Z" fill="url(#gMono)" />
                </Svg>
              </View>
            ) : footerGraphicType === 'line_gold' ? (
              <View style={{ position: 'absolute', bottom: 35, left: 40, right: 40, borderBottomWidth: 1, borderBottomColor: '#C5A880', opacity: 0.5 }} />
            ) : footerGraphicType !== 'none' ? (
              <View style={styles.waveContainer}>
                <Svg viewBox="0 0 600 120" style={{ width: '100%', height: '100%' }}>
                  <Defs>
                    <LinearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0%" stopColor="#D0D0D0" stopOpacity={0.35} />
                      <Stop offset="100%" stopColor="#B0B0B0" stopOpacity={0.15} />
                    </LinearGradient>
                    <LinearGradient id="g2" x1="0" y1="1" x2="1" y2="0">
                      <Stop offset="0%" stopColor="#F5B28B" stopOpacity={0.35} />
                      <Stop offset="100%" stopColor="#EFA478" stopOpacity={0.1} />
                    </LinearGradient>
                  </Defs>
                  <Path d="M-30,120 C120,40 260,130 380,60 C480,0 560,90 630,30 L630,120 Z" fill="url(#g1)" />
                  <Path d="M-30,120 C90,90 220,20 370,80 C490,140 570,60 630,70 L630,120 Z" fill="url(#g2)" />
                </Svg>
              </View>
            ) : null}

            {/* Bottom Footer Row */}
            <View style={styles.plateFooterRow}>
              <Text style={styles.footerText}>
                {[plateFooter, art.price ? formatPrice(art.price) : ''].filter(Boolean).join(' • ')}
              </Text>
              <Text style={styles.footerPageNum}>{pageNum}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
