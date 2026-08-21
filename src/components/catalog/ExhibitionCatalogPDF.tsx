import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { Exhibition, Artwork } from '@/types/exhibition';
import { formatDateRange } from '@/lib/utils';

// 1.5 cm margin in PDF points (1 inch = 72 pt, 1 cm = 28.346 pt, 1.5 cm = 42.52 pt)
const MARGIN_1_5_CM = 42.52;

// Styles matching A4 standard (1.5 cm margin, pure white background, artwork image at the top)
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

  // Main Artwork Container - Positioned directly at the top with no extra gap
  artworkImageContainer: {
    width: '100%',
    height: 480,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },

  // Country Flag & Origin Row
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  flagText: {
    fontSize: 14,
  },
  countryText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#333333',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Lower Section: Artist Photo + Info
  bottomInfoRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  artistPhoto: {
    width: 75,
    height: 90,
    objectFit: 'cover',
    borderRadius: 2,
  },
  infoTextColumn: {
    flex: 1,
  },
  artistName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  artistEmail: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 6,
  },
  artTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  artSpecs: {
    fontSize: 8,
    color: '#555555',
    marginBottom: 6,
  },
  conceptLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  conceptText: {
    fontSize: 7.5,
    lineHeight: 1.35,
    color: '#444444',
    textAlign: 'justify',
  },

  // Page number footer
  pageFooter: {
    position: 'absolute',
    bottom: 18,
    right: MARGIN_1_5_CM,
    fontSize: 7.5,
    color: '#888888',
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
      {/* COVER PAGE (A4, 1.5 cm margin, pure white background) */}
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
      </Page>

      {/* 1 ARTWORK PER PAGE (A4, 1.5 cm margin, pure white background, image at top) */}
      {artworks.map((art, idx) => {
        const artist = art.artist;
        const pageNum = idx + 2;

        return (
          <Page key={art.id} size="A4" style={styles.page}>
            {/* Main High-Res Artwork Image Plate (At the top) */}
            <View style={styles.artworkImageContainer}>
              <Image src={art.imageUrl} style={styles.artworkImage} />
            </View>

            {/* Country Flag & Origin */}
            <View style={styles.flagRow}>
              <Text style={styles.flagText}>{artist?.flagEmoji || '🎨'}</Text>
              <Text style={styles.countryText}>{artist?.country || 'International'}</Text>
            </View>

            {/* Bottom Row: Artist Photo on Left, Details on Right */}
            <View style={styles.bottomInfoRow}>
              {/* Artist Portrait Photo (Only if real photo uploaded, no mockup) */}
              {artist?.avatarUrl &&
                !artist.avatarUrl.includes('unsplash.com/photo-1507003211169') &&
                !artist.avatarUrl.includes('unsplash.com/photo-1534528741775') && (
                  <Image
                    src={artist.avatarUrl}
                    style={styles.artistPhoto}
                  />
                )}

              {/* Artist Info & Artwork Specs & Concept */}
              <View style={styles.infoTextColumn}>
                <Text style={styles.artistName}>{artist?.name || 'Artist'}</Text>
                {artist?.email && (
                  <Text style={styles.artistEmail}>{artist.email}</Text>
                )}

                <Text style={styles.artTitle}>{art.title}</Text>
                <Text style={styles.artSpecs}>
                  {[art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : ''].filter(Boolean).join(' • ')}
                </Text>

                {(art.concept || art.description) && (
                  <Text style={styles.conceptLabel}>
                    Concept : <Text style={styles.conceptText}>{art.concept || art.description}</Text>
                  </Text>
                )}
              </View>
            </View>

            {/* Page Number */}
            <Text style={styles.pageFooter}>{pageNum}</Text>
          </Page>
        );
      })}
    </Document>
  );
}
