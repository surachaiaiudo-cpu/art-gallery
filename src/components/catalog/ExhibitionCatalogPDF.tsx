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
import { formatDateRange, formatPrice } from '@/lib/utils';

// Styles matching International Art Festival Catalog standard (1 artwork per page)
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    color: '#222222',
    fontFamily: 'Helvetica',
    paddingTop: 35,
    paddingBottom: 40,
    paddingLeft: 55,
    paddingRight: 45,
    position: 'relative',
  },
  // Vertical Festival Header on Left Margin
  verticalHeaderContainer: {
    position: 'absolute',
    left: 20,
    top: 280,
    transform: 'rotate(-90deg)',
    width: 450,
  },
  verticalHeaderText: {
    fontSize: 7,
    letterSpacing: 1.2,
    color: '#888888',
    textTransform: 'uppercase',
  },
  // Page number on Top Left
  pageNumber: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 20,
    fontWeight: 'normal',
  },
  // Main Artwork Container
  artworkImageContainer: {
    width: '100%',
    height: 440,
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  // Country Flag Container
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  flagText: {
    fontSize: 18,
  },
  countryText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333333',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Lower Section: Artist Photo + Info
  bottomInfoRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  artistPhoto: {
    width: 90,
    height: 105,
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
    fontSize: 8.5,
    color: '#666666',
    marginBottom: 2,
  },
  artistCountry: {
    fontSize: 8.5,
    color: '#666666',
    marginBottom: 8,
  },
  artTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  artSpecs: {
    fontSize: 8.5,
    color: '#555555',
    marginBottom: 8,
  },
  artPrice: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#8C6D3F',
    marginBottom: 8,
  },
  conceptLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  conceptText: {
    fontSize: 8,
    lineHeight: 1.4,
    color: '#444444',
    textAlign: 'justify',
  },

  // Cover Page Styles
  coverPage: {
    backgroundColor: '#F5F3EE',
    padding: 45,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  coverTitleBox: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  coverLogo: {
    fontSize: 26,
    letterSpacing: 4,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    color: '#1A1918',
  },
  coverSub: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#8A8478',
    marginBottom: 20,
  },
  coverBanner: {
    width: '100%',
    height: 380,
    objectFit: 'cover',
    borderRadius: 2,
    marginBottom: 24,
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

          <Image
            src={
              exhibition.bannerUrl ||
              'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1600&auto=format&fit=crop'
            }
            style={styles.coverBanner}
          />

          <View style={styles.coverTitleBox}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1A1918', marginBottom: 6 }}>
              {exhibition.title}
            </Text>
            <Text style={{ fontSize: 10, color: '#6A6458', marginBottom: 4 }}>
              {curator?.name ? `Curated by: ${curator.name}` : 'ARTVARA Curated Collection'}
            </Text>
            <Text style={{ fontSize: 9, color: '#8C8578' }}>
              {formatDateRange(exhibition.startDate, exhibition.endDate)}
            </Text>
          </View>
        </View>

        <View style={{ textAlign: 'center', borderTopWidth: 1, borderTopColor: '#DDD6C8', paddingTop: 10 }}>
          <Text style={{ fontSize: 7.5, color: '#888888', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            International Art Festival and Art Exhibition in Thailand • ARTVARA Online Gallery
          </Text>
        </View>
      </Page>

      {/* 1 ARTWORK PER PAGE - MATCHING USER SPECIFICATION & UPLOADED REFERENCE PHOTO */}
      {artworks.map((art, idx) => {
        const artist = art.artist;
        const pageNum = idx + 2;

        return (
          <Page key={art.id} size="A4" style={styles.page}>
            {/* Left Margin Vertical Running Header */}
            <View style={styles.verticalHeaderContainer}>
              <Text style={styles.verticalHeaderText}>
                ARTVARA International Art Festival and Curated Exhibition in Thailand
              </Text>
            </View>

            {/* Top Left Page Number */}
            <Text style={styles.pageNumber}>{pageNum}</Text>

            {/* Main High-Res Artwork Image Plate */}
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
              {/* Artist Portrait Photo */}
              <Image
                src={
                  artist?.avatarUrl ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop'
                }
                style={styles.artistPhoto}
              />

              {/* Artist Info & Artwork Specs & Concept */}
              <View style={styles.infoTextColumn}>
                <Text style={styles.artistName}>{artist?.name || 'Artist'}</Text>
                <Text style={styles.artistEmail}>{artist?.email || 'contact@artvara.gallery'}</Text>
                <Text style={styles.artistCountry}>{artist?.country || 'International'}</Text>

                <Text style={styles.artTitle}>{art.title}</Text>
                <Text style={styles.artSpecs}>
                  {art.medium || 'Mixed Media'} {art.dimensions || '120 x 100 cm.'}
                </Text>

                <Text style={styles.conceptLabel}>
                  Concept : <Text style={styles.conceptText}>{art.concept || art.description || 'This work investigates sacred cultural heritage and contemporary memory.'}</Text>
                </Text>
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
