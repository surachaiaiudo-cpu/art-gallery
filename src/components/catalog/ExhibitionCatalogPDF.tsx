'use client';

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

// Register Thai & Latin Vector TrueType Fonts
Font.register({
  family: 'Sarabun',
  fonts: [
    {
      src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Bold.ttf',
      fontWeight: 'bold',
    },
    {
      src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Italic.ttf',
      fontStyle: 'italic',
    },
  ],
});

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
    fontFamily: 'Sarabun',
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
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#000000',
  },
  headerSub: {
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
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: '#333333',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  coverTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
    textAlign: 'center',
  },
  coverCurator: {
    fontSize: 10,
    color: '#444444',
    marginBottom: 3,
  },
  coverReviewers: {
    fontSize: 8.5,
    color: '#555555',
    marginBottom: 4,
    textAlign: 'center',
    maxWidth: 450,
  },
  coverDate: {
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
  },
  coverFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    textAlign: 'center',
    fontSize: 8,
    color: '#666666',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  // Peer Review & Statement Page
  statementHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    color: '#000000',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  sectionSub: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 8,
  },
  reviewerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 4,
    marginBottom: 6,
  },
  reviewerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    width: 32,
    height: 36,
    borderRadius: 3,
    marginRight: 8,
    objectFit: 'cover',
    backgroundColor: '#1A1918',
  },
  reviewerAvatarPlaceholder: {
    width: 32,
    height: 36,
    borderRadius: 3,
    marginRight: 8,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerPlaceholderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#444444',
  },
  reviewerRoleBadge: {
    fontSize: 7,
    fontWeight: 'bold',
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginRight: 4,
    color: '#000000',
  },
  reviewerName: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#000000',
  },
  reviewerInst: {
    fontSize: 8,
    color: '#555555',
    marginTop: 1,
  },
  reviewerCountry: {
    fontSize: 8,
    color: '#777777',
  },
  statementBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  statementQuote: {
    fontSize: 8.5,
    fontStyle: 'italic',
    color: '#333333',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  statementAuthor: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
  },
  // Artwork Plate Pages
  artworkImageContainer: {
    width: '100%',
    height: 480,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  artworkImage: {
    maxHeight: '100%',
    maxWidth: '100%',
    objectFit: 'contain',
  },
  plateDetailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  plateLeftCol: {
    width: 60,
    marginRight: 12,
    alignItems: 'flex-start',
  },
  plateFlag: {
    width: 24,
    height: 14,
    borderWidth: 0.5,
    borderColor: '#D0D0D0',
    marginBottom: 4,
    objectFit: 'cover',
  },
  plateArtistPhoto: {
    width: 54,
    height: 64,
    borderRadius: 4,
    objectFit: 'cover',
    backgroundColor: '#1A1A1A',
  },
  plateArtistPlaceholder: {
    width: 54,
    height: 64,
    borderRadius: 4,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateRightCol: {
    flex: 1,
  },
  artistName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  artistEmail: {
    fontSize: 7.5,
    color: '#666666',
  },
  artistCountry: {
    fontSize: 7.5,
    color: '#666666',
    marginBottom: 4,
  },
  artworkTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  artworkSpecs: {
    fontSize: 8,
    color: '#444444',
    marginBottom: 4,
  },
  conceptContainer: {
    fontSize: 8,
    color: '#333333',
    lineHeight: 1.3,
  },
  conceptLabel: {
    fontWeight: 'bold',
    color: '#000000',
  },
  plateFooterRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#777777',
  },
  pageNumber: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#555555',
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
}: ExhibitionCatalogPDFProps) {
  const coverFooter = coverFooterText || getCatalogFooterText(exhibition);
  const plateFooter = plateFooterText || getCatalogPlateFooterText(exhibition);
  const reviewers = peerReviewers || getExhibitionPeerReviewers(exhibition);
  const hasReviewers = reviewers.length > 0;
  const artworks = exhibition.artworks || [];
  const curator = exhibition.curator;

  return (
    <Document
      title={`${exhibition.title} - Official Exhibition Catalog`}
      author={curator?.name || 'ARTVARA Curatorial Team'}
      subject={
        standard === 'pdfx'
          ? 'PDF/X-1a:2001 ISO 15930-1 Prepress Commercial Print-Ready Vector Catalog'
          : 'Standard Digital Vector Catalog'
      }
      keywords="ARTVARA, Exhibition Catalog, Vector Typography, ISO 15930-1"
      creator="ARTVARA High-Fidelity Vector Catalog Generator"
    >
      {/* 1. Cover Page */}
      <Page size="A4" style={styles.page}>
        <View>
          <View style={styles.headerContainer}>
            <Text style={styles.headerLogo}>ARTVARA</Text>
            <Text style={styles.headerSub}>International Art Festival & Curated Exhibition</Text>
          </View>

          {exhibition.bannerUrl && (
            <View style={styles.coverBannerContainer}>
              <PdfImage src={exhibition.bannerUrl} style={styles.coverBanner} />
            </View>
          )}

          <View style={styles.coverContent}>
            <Text style={styles.catalogBadge}>Official Exhibition Catalog (สูจิบัตร)</Text>
            <Text style={styles.coverTitle}>{exhibition.title}</Text>
            {curator?.name && (
              <Text style={styles.coverCurator}>
                Curated by: <Text style={{ fontWeight: 'bold' }}>{curator.name}</Text>
              </Text>
            )}
            {hasReviewers && (
              <Text style={styles.coverReviewers}>
                Peer Review Committee:{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {reviewers.map((r) => [r.academicTitle, r.name].filter(Boolean).join(' ')).join(' • ')}
                </Text>
              </Text>
            )}
            <Text style={styles.coverDate}>
              {formatDateRange(exhibition.startDate, exhibition.endDate)}
            </Text>
          </View>
        </View>

        <Text style={styles.coverFooter}>{coverFooter}</Text>
      </Page>

      {/* 2. Peer Review Board & Curatorial Statement Page (If reviewers exist) */}
      {hasReviewers && (
        <Page size="A4" style={styles.page}>
          <View>
            <View style={styles.statementHeader}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', letterSpacing: 2, color: '#000000' }}>
                ARTVARA
              </Text>
              <Text style={{ fontSize: 7.5, color: '#666666', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 1 }}>
                Academic Peer Review Board & Curatorial Statement
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Review Committee)
            </Text>
            <Text style={styles.sectionSub}>
              รายนามคณะกรรมการผู้ทรงคุณวุฒิในการพิจารณาและประเมินผลงานศิลปกรรมในนิทรรศการ
            </Text>

            <View style={{ marginTop: 2 }}>
              {reviewers.map((reviewer, idx) => (
                <View key={idx} style={styles.reviewerCard}>
                  <View style={styles.reviewerLeft}>
                    {reviewer.avatarUrl ? (
                      <PdfImage src={reviewer.avatarUrl} style={styles.reviewerAvatar} />
                    ) : (
                      <View style={styles.reviewerAvatarPlaceholder}>
                        <Text style={styles.reviewerPlaceholderText}>
                          {reviewer.name?.trim().charAt(0).toUpperCase() || 'R'}
                        </Text>
                      </View>
                    )}
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.reviewerRoleBadge}>
                          {reviewer.role || (idx === 0 ? 'ประธานกรรมการ' : 'กรรมการผู้ทรงคุณวุฒิ')}
                        </Text>
                        <Text style={styles.reviewerName}>
                          {[reviewer.academicTitle, reviewer.name].filter(Boolean).join(' ')}
                        </Text>
                      </View>
                      {reviewer.institution && (
                        <Text style={styles.reviewerInst}>{reviewer.institution}</Text>
                      )}
                    </View>
                  </View>
                  {reviewer.country && (
                    <Text style={styles.reviewerCountry}>{reviewer.country}</Text>
                  )}
                </View>
              ))}
            </View>

            {exhibition.curatorNote && (
              <View style={styles.statementBox}>
                <Text style={styles.sectionTitle}>คำนำภัณฑารักษ์ (Curatorial Statement)</Text>
                <Text style={styles.statementQuote}>"{exhibition.curatorNote}"</Text>
                {curator?.name && (
                  <Text style={styles.statementAuthor}>— {curator.name} (Curator)</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.plateFooterRow}>
            <Text>{plateFooter || 'Editorial & Academic Accreditation Board'}</Text>
            <Text style={styles.pageNumber}>2</Text>
          </View>
        </Page>
      )}

      {/* 3. Artwork Plate Pages */}
      {artworks.map((art, idx) => {
        const artist = art.artist;
        const pageNum = hasReviewers ? idx + 3 : idx + 2;
        const hasRealPhoto =
          artist?.avatarUrl &&
          !artist.avatarUrl.includes('unsplash.com/photo-1507003211169') &&
          !artist.avatarUrl.includes('unsplash.com/photo-1534528741775');

        return (
          <Page key={art.id} size="A4" style={styles.page}>
            <View>
              {/* Main Large Artwork Image */}
              <View style={styles.artworkImageContainer}>
                <PdfImage src={art.imageUrl} style={styles.artworkImage} />
              </View>

              {/* Details Row */}
              <View style={styles.plateDetailsRow}>
                {/* Left Column: Flag Image on top, Artist Photo below */}
                <View style={styles.plateLeftCol}>
                  <PdfImage src={getFlagImageUrl(artist?.country)} style={styles.plateFlag} />
                  {hasRealPhoto ? (
                    <PdfImage src={artist!.avatarUrl!} style={styles.plateArtistPhoto} />
                  ) : (
                    <View style={styles.plateArtistPlaceholder}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333333' }}>
                        {artist?.name?.trim().charAt(0).toUpperCase() || 'A'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Right Column: Artist Info & Artwork Specs & Concept */}
                <View style={styles.plateRightCol}>
                  <Text style={styles.artistName}>{artist?.name || 'Artist'}</Text>
                  {artist?.email && <Text style={styles.artistEmail}>{artist.email}</Text>}
                  <Text style={styles.artistCountry}>{artist?.country || 'International'}</Text>

                  <Text style={styles.artworkTitle}>{art.title}</Text>
                  <Text style={styles.artworkSpecs}>
                    {[art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : ''].filter(Boolean).join(' ')}
                  </Text>

                  {(art.concept?.trim() || art.description?.trim()) && (
                    <Text style={styles.conceptContainer}>
                      <Text style={styles.conceptLabel}>Concept : </Text>
                      <Text>{art.concept?.trim() || art.description?.trim()}</Text>
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Footer Row */}
            <View style={styles.plateFooterRow}>
              <Text>
                {plateFooter ? plateFooter : ''}
                {art.price ? (plateFooter ? ` • ${formatPrice(art.price)}` : formatPrice(art.price)) : ''}
              </Text>
              <Text style={styles.pageNumber}>{pageNum}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
