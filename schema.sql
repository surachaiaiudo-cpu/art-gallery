-- Cloudflare D1 SQL Schema for ARTVARA Art Gallery

-- 1. Table: users (Curators, Artists, Admins)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('admin', 'curator', 'artist')) DEFAULT 'artist',
    bio TEXT,
    avatar_url TEXT,
    social_links TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: exhibitions
CREATE TABLE IF NOT EXISTS exhibitions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    curator_note TEXT,
    banner_url TEXT,
    catalog_pdf_url TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status TEXT CHECK(status IN ('upcoming', 'active', 'archived')) DEFAULT 'upcoming',
    theme_config TEXT, -- JSON string: { wallColor, floorType, lightingMood, ambientAudioUrl }
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: artworks
CREATE TABLE IF NOT EXISTS artworks (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    year_created INTEGER,
    medium TEXT,
    dimensions TEXT,
    cloudinary_public_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    model_3d_url TEXT,
    price REAL,
    status TEXT CHECK(status IN ('available', 'reserved', 'sold', 'not_for_sale')) DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Table: exhibition_artworks
CREATE TABLE IF NOT EXISTS exhibition_artworks (
    exhibition_id TEXT NOT NULL,
    artwork_id TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    wall_position TEXT, -- JSON: { x: number, y: number, z: number, rotationY: number, wallIndex: number, scale?: number }
    PRIMARY KEY (exhibition_id, artwork_id),
    FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id) ON DELETE CASCADE,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- 5. Table: inquiries
CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    artwork_id TEXT NOT NULL,
    visitor_name TEXT NOT NULL,
    visitor_email TEXT NOT NULL,
    message TEXT,
    status TEXT CHECK(status IN ('pending', 'contacted', 'completed')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- 6. Table: guestbook_entries
CREATE TABLE IF NOT EXISTS guestbook_entries (
    id TEXT PRIMARY KEY,
    exhibition_id TEXT NOT NULL,
    visitor_name TEXT NOT NULL,
    visitor_email TEXT,
    visitor_country TEXT DEFAULT 'Thailand',
    message TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    is_approved INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id) ON DELETE CASCADE
);
