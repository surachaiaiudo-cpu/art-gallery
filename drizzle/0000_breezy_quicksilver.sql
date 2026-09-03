CREATE TABLE `artworks` (
	`id` text PRIMARY KEY NOT NULL,
	`artist_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`concept` text,
	`year_created` integer,
	`medium` text,
	`dimensions` text,
	`cloudinary_public_id` text NOT NULL,
	`image_url` text NOT NULL,
	`model_3d_url` text,
	`price` real,
	`status` text DEFAULT 'available' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`artist_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exhibition_artworks` (
	`exhibition_id` text NOT NULL,
	`artwork_id` text NOT NULL,
	`display_order` integer DEFAULT 0,
	`wall_position` text,
	FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exhibitions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`curator_id` text,
	`curator_note` text,
	`banner_url` text,
	`catalog_pdf_url` text,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`status` text DEFAULT 'upcoming' NOT NULL,
	`theme_config` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`curator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exhibitions_slug_unique` ON `exhibitions` (`slug`);--> statement-breakpoint
CREATE TABLE `guestbook_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`exhibition_id` text NOT NULL,
	`visitor_name` text NOT NULL,
	`visitor_email` text,
	`visitor_country` text DEFAULT 'Thailand',
	`message` text NOT NULL,
	`rating` integer DEFAULT 5,
	`is_approved` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`exhibition_id`) REFERENCES `exhibitions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`artwork_id` text NOT NULL,
	`visitor_name` text NOT NULL,
	`visitor_email` text NOT NULL,
	`message` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'artist' NOT NULL,
	`country` text,
	`flag_emoji` text,
	`bio` text,
	`avatar_url` text,
	`social_links` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);