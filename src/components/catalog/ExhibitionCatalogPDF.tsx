import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Svg,
  Path,
  Defs,
  LinearGradient,
  Stop,
  StyleSheet,
} from '@react-pdf/renderer';
import { Exhibition, Artwork } from '@/types/exhibition';
import { formatDateRange } from '@/lib/utils';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';

// 1.5 cm margin in PDF points (1 inch = 72 pt, 1 cm = 28.346 pt, 1.5 cm = 42.52 pt)
const MARGIN_1_5_CM = 42.52;

// Exactly 8 inches from top of A4 page = 8 * 72 pt = 576 pt.
// Artwork height = 576 pt - 42.52 pt (top margin) = 533.48 pt (approx 525 pt).
const ARTWORK_CONTAINER_HEIGHT = 525;

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    color: '#1A1918',
    fontFamily: 'Helvetica',
    paddingTop: MARGIN_1_5_CM,
    paddingBottom: MARGIN_1_5_CM,
    paddingLeft: MARGIN_1_5_CM,
    paddingRight: MARGIN_1_5_CM,
    position: 'relative',
  },

  // 1. Artwork Plate: Top margin (1.5 cm) down to 8 inches (576 pt) from top
  artworkImageContainer: {
    width: '100%',
    height: ARTWORK_CONTAINER_HEIGHT,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },

  // 2. Lower Section: Starts at 8 inches from top
  detailsContainer: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
    zIndex: 10,
  },

  // Left Column: Flag ON TOP, Artist Photo DIRECTLY BELOW
  artistPhotoColumn: {
    width: 76,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  flagImage: {
    width: 36,
    height: 24,
    borderRadius: 3,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#D8D2C6',
    objectFit: 'cover',
  },
  artistPhoto: {
    width: 74,
    height: 88,
    objectFit: 'cover',
    borderRadius: 6,
  },
  artistPhotoPlaceholder: {
    width: 74,
    height: 88,
    backgroundColor: '#F3EFE8',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#D8D2C6',
  },
  artistInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8C6D3F',
  },

  // Right Column: Details of Artwork & Artist
  infoTextColumn: {
    flex: 1,
  },
  artistName: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 1.5,
  },
  artistEmail: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 1.5,
  },
  artistCountry: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 7,
  },

  artTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 1.5,
  },
  artSpecs: {
    fontSize: 8,
    color: '#555555',
    marginBottom: 7,
  },

  conceptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  conceptLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  conceptText: {
    fontSize: 8,
    lineHeight: 1.35,
    color: '#444444',
    textAlign: 'justify',
  },

  // Bottom Artistic Wave Overlay
  bottomWaveSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 595.28,
    height: 140,
    zIndex: 1,
  },

  // Cover Page Styles (Strict A4, pure white background, 1.5 cm margin)
  coverPage: {
    backgroundColor: '#FFFFFF',
    paddingTop: MARGIN_1_5_CM,
    paddingBottom: MARGIN_1_5_CM,
    paddingLeft: MARGIN_1_5_CM,
    paddingRight: MARGIN_1_5_CM,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    position: 'relative',
  },
  coverTitleBox: {
    textAlign: 'center',
    paddingHorizontal: 15,
  },
  coverLogo: {
    fontSize: 22,
    letterSpacing: 4,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#1A1918',
  },
  coverSub: {
    fontSize: 7.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#777777',
    marginBottom: 16,
  },
  coverBanner: {
    width: '100%',
    height: 440,
    objectFit: 'contain',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
});

interface ExhibitionCatalogPDFProps {
  exhibition: Exhibition;
}

export function ExhibitionCatalogPDF({ exhibition }: ExhibitionCatalogPDFProps) {
  const artworks = exhibition.artworks || [];
  const curator = exhibition.curator;

  return (
    <Document
      title={`ARTVARA - ${exhibition.title} (Exhibition Catalog)`}
      author="ARTVARA Curatorial Gallery"
      subject="International Art Exhibition Catalog"
    >
      {/* COVER PAGE */}
      <Page size="A4" style={styles.coverPage}>
        <View>
          <Text style={styles.coverLogo}>ARTVARA</Text>
          <Text style={styles.coverSub}>International Curated Art Festival & Exhibition</Text>

          {exhibition.bannerUrl && (
            <Image
              src={exhibition.bannerUrl}
              style={styles.coverBanner}
            />
          )}

          <View style={styles.coverTitleBox}>
            <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1A1918', marginBottom: 5 }}>
              {exhibition.title}
            </Text>
            <Text style={{ fontSize: 9.5, color: '#555555', marginBottom: 4 }}>
              {curator?.name ? `Curated by: ${curator.name}` : 'ARTVARA Curated Collection'}
            </Text>
            <Text style={{ fontSize: 8.5, color: '#777777' }}>
              {formatDateRange(exhibition.startDate, exhibition.endDate)}
            </Text>
          </View>
        </View>

        <View style={{ textAlign: 'center', borderTopWidth: 0.5, borderTopColor: '#E0DCD4', paddingTop: 8 }}>
          <Text style={{ fontSize: 7, color: '#888888', letterSpacing: 1, textTransform: 'uppercase' }}>
            International Art Festival and Art Exhibition in Thailand • ARTVARA Online Gallery
          </Text>
        </View>

        {/* Decorative Wave at Bottom */}
        <Svg width="595.28" height="120" viewBox="0 0 600 120" style={styles.bottomWaveSvg}>
          <Defs>
            <LinearGradient id="coverWave1" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#E2DCD2" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#C5A880" stopOpacity={0.2} />
            </LinearGradient>
            <LinearGradient id="coverWave2" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#F5B28B" stopOpacity={0.3} />
              <Stop offset="100%" stopColor="#EFA478" stopOpacity={0.15} />
            </LinearGradient>
          </Defs>
          <Path
            d="M-30,120 C120,40 260,130 380,60 C480,0 560,90 630,30 L630,120 Z"
            fill="url(#coverWave1)"
          />
          <Path
            d="M-30,120 C90,90 220,20 370,80 C490,140 570,60 630,70 L630,120 Z"
            fill="url(#coverWave2)"
          />
        </Svg>
      </Page>

      {/* 1 ARTWORK PER PAGE: Matches Uploaded Reference Example Exactly */}
      {artworks.map((art) => {
        const artist = art.artist;
        const flagUrl = getFlagImageUrl(artist?.country);
        const hasRealPhoto =
          artist?.avatarUrl &&
          !artist.avatarUrl.includes('unsplash.com/photo-1507003211169') &&
          !artist.avatarUrl.includes('unsplash.com/photo-1534528741775');

        return (
          <Page key={art.id} size="A4" style={styles.page}>
            {/* 1. Artwork Plate: Spans from 1.5 cm Top Margin to 8 Inches (576 pt) */}
            <View style={styles.artworkImageContainer}>
              <Image src={art.imageUrl} style={styles.artworkImage} />
            </View>

            {/* 2. Details Section (Starts exactly at 8 inches from top) */}
            <View style={styles.detailsContainer}>
              {/* Left Column: Flag on top, Artist Photo directly below */}
              <View style={styles.artistPhotoColumn}>
                {/* Flag Image Badge - Above Photo */}
                <Image
                  src={flagUrl}
                  style={styles.flagImage}
                />

                {/* Artist Photo - Directly Below Flag */}
                {hasRealPhoto ? (
                  <Image
                    src={artist!.avatarUrl!}
                    style={styles.artistPhoto}
                  />
                ) : (
                  <View style={styles.artistPhotoPlaceholder}>
                    <Text style={styles.artistInitial}>
                      {artist?.name?.trim().charAt(0).toUpperCase() || 'A'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Right Column: Artist Info & Artwork Specs & Concept */}
              <View style={styles.infoTextColumn}>
                {/* Artist Info */}
                <Text style={styles.artistName}>{artist?.name || 'Artist'}</Text>
                {artist?.email && (
                  <Text style={styles.artistEmail}>{artist.email}</Text>
                )}
                <Text style={styles.artistCountry}>{artist?.country || 'International'}</Text>

                {/* Artwork Specs */}
                <Text style={styles.artTitle}>{art.title}</Text>
                <Text style={styles.artSpecs}>
                  {[art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : ''].filter(Boolean).join(' ')}
                </Text>

                {/* Concept */}
                {(art.concept || art.description) && (
                  <Text style={styles.conceptText}>
                    <Text style={styles.conceptLabel}>Concept : </Text>
                    {art.concept || art.description}
                  </Text>
                )}
              </View>
            </View>

            {/* Decorative Soft Wave Loop at Bottom Matching Reference */}
            <Svg width="595.28" height="140" viewBox="0 0 600 140" style={styles.bottomWaveSvg}>
              <Defs>
                <LinearGradient id={`artWave1-${art.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#E2DCD2" stopOpacity={0.35} />
                  <Stop offset="100%" stopColor="#C5A880" stopOpacity={0.2} />
                </LinearGradient>
                <LinearGradient id={`artWave2-${art.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#F5B28B" stopOpacity={0.3} />
                  <Stop offset="100%" stopColor="#EFA478" stopOpacity={0.15} />
                </LinearGradient>
              </Defs>
              <Path
                d="M-30,140 C120,50 260,150 380,70 C480,10 560,100 630,40 L630,140 Z"
                fill={`url(#artWave1-${art.id})`}
              />
              <Path
                d="M-30,140 C90,100 220,30 370,90 C490,160 570,70 630,80 L630,140 Z"
                fill={`url(#artWave2-${art.id})`}
              />
            </Svg>
          </Page>
        );
      })}
    </Document>
  );
}
