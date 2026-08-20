import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['admin', 'curator', 'artist'] }).default('artist').notNull(),
  country: text('country'),
  flagEmoji: text('flag_emoji'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  socialLinks: text('social_links'), // JSON string: { website, instagram, twitter }
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const exhibitions = sqliteTable('exhibitions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  curatorNote: text('curator_note'),
  bannerUrl: text('banner_url'),
  catalogPdfUrl: text('catalog_pdf_url'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status', { enum: ['upcoming', 'active', 'archived'] }).default('upcoming').notNull(),
  themeConfig: text('theme_config'), // JSON string: { wallTexture, wallColor, floorColor, spotlightIntensity }
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const artworks = sqliteTable('artworks', {
  id: text('id').primaryKey(),
  artistId: text('artist_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  concept: text('concept'),
  yearCreated: integer('year_created'),
  medium: text('medium'),
  dimensions: text('dimensions'),
  cloudinaryPublicId: text('cloudinary_public_id').notNull(),
  imageUrl: text('image_url').notNull(),
  model3dUrl: text('model_3d_url'),
  price: real('price'),
  status: text('status', { enum: ['available', 'reserved', 'sold', 'not_for_sale'] }).default('available').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const exhibitionArtworks = sqliteTable('exhibition_artworks', {
  exhibitionId: text('exhibition_id').notNull().references(() => exhibitions.id, { onDelete: 'cascade' }),
  artworkId: text('artwork_id').notNull().references(() => artworks.id, { onDelete: 'cascade' }),
  displayOrder: integer('display_order').default(0),
  wallPosition: text('wall_position'), // JSON string: { x, y, z, rotationY, wallIndex, frameStyle }
});

export const inquiries = sqliteTable('inquiries', {
  id: text('id').primaryKey(),
  artworkId: text('artwork_id').notNull().references(() => artworks.id, { onDelete: 'cascade' }),
  visitorName: text('visitor_name').notNull(),
  visitorEmail: text('visitor_email').notNull(),
  message: text('message'),
  status: text('status', { enum: ['pending', 'contacted', 'completed'] }).default('pending').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Exhibition = typeof exhibitions.$inferSelect;
export type NewExhibition = typeof exhibitions.$inferInsert;
export type Artwork = typeof artworks.$inferSelect;
export type NewArtwork = typeof artworks.$inferInsert;
export type ExhibitionArtwork = typeof exhibitionArtworks.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;
