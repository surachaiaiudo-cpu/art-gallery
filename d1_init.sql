-- ==========================================================
-- Cloudflare D1 Database Schema & Seed for ARTVARA Gallery
-- ==========================================================

DROP TABLE IF EXISTS inquiries;
DROP TABLE IF EXISTS exhibition_artworks;
DROP TABLE IF EXISTS artworks;
DROP TABLE IF EXISTS exhibitions;
DROP TABLE IF EXISTS users;

-- 1. Table: users (Curators, Artists, Admins)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('admin', 'curator', 'artist')) DEFAULT 'artist',
    country TEXT,
    flag_emoji TEXT,
    bio TEXT,
    avatar_url TEXT,
    social_links TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: exhibitions
CREATE TABLE exhibitions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    curator_note TEXT,
    banner_url TEXT,
    catalog_pdf_url TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status TEXT CHECK(status IN ('upcoming', 'active', 'archived')) DEFAULT 'upcoming',
    theme_config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: artworks
CREATE TABLE artworks (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    concept TEXT,
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
CREATE TABLE exhibition_artworks (
    exhibition_id TEXT NOT NULL,
    artwork_id TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    wall_position TEXT,
    PRIMARY KEY (exhibition_id, artwork_id),
    FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id) ON DELETE CASCADE,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- 5. Table: inquiries
CREATE TABLE inquiries (
    id TEXT PRIMARY KEY,
    artwork_id TEXT NOT NULL,
    visitor_name TEXT NOT NULL,
    visitor_email TEXT NOT NULL,
    message TEXT,
    status TEXT CHECK(status IN ('pending', 'contacted', 'completed')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- ==========================================================
-- Initial Seed Data: Users (Curators & Artists)
-- ==========================================================
INSERT INTO users (id, name, email, role, country, flag_emoji, bio, avatar_url, social_links) VALUES
('curator-1', 'Ms. Anchalee S. (อัญชลี ศรีกาญจน์)', 'anchalee.s@artvara.gallery', 'curator', 'Thailand', '🇹🇭', 'Senior Curator at ARTVARA Gallery with over 15 years of experience in Southeast Asian and International contemporary heritage art curation.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop', '{"website":"https://artvara.gallery/anchalee","instagram":"@anchalee_curates"}'),
('curator-2', 'Dr. Marcus Vance (ดร. มาร์คัส แวนซ์)', 'marcus.vance@artvara.gallery', 'curator', 'United Kingdom', '🇬🇧', 'Guest International Curator specializing in Asian modernism, riverine cultural geographies, and transnational abstract movements.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop', '{"website":"https://artvara.gallery/marcus"}'),
('artist-1', 'Fassih Keiso', 'fassihkeiso@yahoo.com', 'artist', 'Australia', '🇦🇺', 'Australian-Syrian interdisciplinary artist examining the intersections of cultural heritage, ancient monuments, and contemporary geopolitical conflicts.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop', '{"instagram":"@fassih_keiso_art"}'),
('artist-2', 'Somchai Jaiyen (สมชาย ใจเย็น)', 'somchai.jaiyen@artsiam.com', 'artist', 'Thailand', '🇹🇭', 'Master of atmospheric landscape oil paintings, celebrated for his dramatic play of sunlight across historical Siamese landmarks.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop', '{"instagram":"@somchai_oilart"}'),
('artist-3', 'Sasithol Arivarat (ศศิธร อารีวรัตน์)', 'sasithol.a@studio.th', 'artist', 'Thailand', '🇹🇭', 'Contemporary impressionist who blends traditional Siamese gold leaf techniques with textured European impasto on Belgian linen.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop', '{"instagram":"@sasithol_art"}'),
('artist-4', 'Arunee Thammarat (อรุณี ธรรมรัตน์)', 'artdes@ayutthayarevival.org', 'artist', 'France / Thailand', '🇫🇷', 'Portrait artist known for reviving royal court attires and evocative historical portraiture with classical chiaroscuro lighting.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop', '{"instagram":"@artdes_siamelegance"}'),
('artist-5', 'Sarawathudam (สราวุธ อุดมศิลป์)', 'sarawathudam@templeart.th', 'artist', 'Thailand', '🇹🇭', 'Sculptor and mixed-media painter exploring Buddhist philosophy and the impermanence of sacred ruins.', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop', '{"instagram":"@sarawathudam"}'),
('artist-6', 'Akhil Namwan (อคิล น้ำหวาน)', 'akhil.namwan@gallery.th', 'artist', 'Thailand', '🇹🇭', 'Ayutthaya native whose work captures the tranquil morning mists shrouding the royal stupas of Wat Phra Si Sanphet.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop', '{"instagram":"@akhil_namwan"}'),
('artist-7', 'Elena Rossi (เอเลนา รอสซี)', 'elena.rossi@firenzeart.it', 'artist', 'Italy', '🇮🇹', 'Italian classical preservation painter exploring ancient stupas and maritime trade aesthetics through renaissance tempera and gold leaf.', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop', '{"instagram":"@elena_rossi_studio"}'),
('artist-8', 'Kenji Takahashi (เคนจิ ทาคานาชิ)', 'kenji.t@tokyoart.jp', 'artist', 'Japan', '🇯🇵', 'Contemporary Japanese minimalist sculptor and ink painter investigating tranquility, geometric stillness, and natural stone textures.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop', '{"instagram":"@kenji_zen_art"}');

-- ==========================================================
-- Initial Seed Data: Exhibitions
-- ==========================================================
INSERT INTO exhibitions (id, title, slug, curator_note, banner_url, catalog_pdf_url, start_date, end_date, status, theme_config) VALUES
('exh-01', 'The Golden Age of Ayutthaya: A Curated Collection (ยุคทองแห่งกรุงศรีอยุธยา)', 'the-golden-age-of-ayutthaya', 'อยุธยา ราชธานีอันยิ่งใหญ่ของสยามประเทศระหว่างปี พ.ศ. 1893 ถึง 2310 คือประจักษ์พยานแห่งความรุ่งเรืองทางศิลปวัฒนธรรม ความศรัทธา และเส้นทางการค้าทางทะเลระดับนานาชาติ', 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1600&auto=format&fit=crop', '/api/exhibitions/the-golden-age-of-ayutthaya/catalog', '2026-08-01', '2026-10-31', 'active', '{"wallTexture":"wood-warm","wallColor":"#2B1E16","floorColor":"#E6E0D4","spotlightIntensity":1.8}'),
('exh-02', 'Siam Contemporary: Horizons of Light & Form (สยามร่วมสมัย: ขอบฟ้าแห่งแสงและรูปทรง)', 'siam-contemporary-horizons', 'การสำรวจมิติใหม่ของศิลปะร่วมสมัยในเอเชียตะวันออกเฉียงใต้ ที่ผสมผสานความเรียบง่ายแบบเซน (Zen Minimalism) เข้ากับรูปทรงนามธรรมและมวลสารทางวัฒนธรรมดั้งเดิม', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1600&auto=format&fit=crop', '/api/exhibitions/siam-contemporary-horizons/catalog', '2026-11-01', '2027-01-31', 'active', '{"wallTexture":"gallery-white","wallColor":"#1F1E1B","floorColor":"#DDD7CC","spotlightIntensity":2.0}'),
('exh-03', 'Monsoon Whispers: Riverine Chronicles (เสียงกระซิบแห่งสายฝนและสายนที)', 'monsoon-whispers-southeast-asia', 'วิถีชีวิตริมสายน้ำเจ้าพระยาและแม่น้ำโขง ภายใต้การโอบกอดของฤดูมรสุมและแสงสะท้อนแห่งธรรมชาติ', 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=1600&auto=format&fit=crop', '/api/exhibitions/monsoon-whispers-southeast-asia/catalog', '2026-05-01', '2026-07-31', 'archived', '{"wallTexture":"warm-stone","wallColor":"#26221D","floorColor":"#E2DBD0","spotlightIntensity":1.6}');

-- ==========================================================
-- Initial Seed Data: Artworks
-- ==========================================================
INSERT INTO artworks (id, artist_id, title, description, concept, year_created, medium, dimensions, cloudinary_public_id, image_url, price, status) VALUES
('art-01', 'artist-1', '03.04.2017 (Echoes of Palmyra)', 'Mixed media composition on textured canvas depicting the preservation of sacred head statues amid archaeological resilience.', 'This Work Deals With The Impact Of Wars On Human Race Culture And Humanity. The Destruction Of World Cultural Heritage. The Image Is One Of The Head Statues That Destroyed During The Destruction Of Palmyra, The Archaeological Site During The War In Syria.', 2017, 'Mixed Media', '120 x 100 cm.', 'artvara/keiso-palmyra-03042017', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop', 240000, 'available'),
('art-02', 'artist-2', 'Sunrise at Wat Chaiwatthanaram', 'Luminous depiction of the magnificent Khmer-style prangs bathed in early morning golden light reflecting over the Chao Phraya river bank.', 'Captures the ephemeral morning mist dissolving into radiant golden light across the sacred stupas of Ayutthaya, symbolizing spiritual rebirth and the timeless endurance of Siamese heritage.', 2026, 'Oil on Canvas', '120 x 180 cm.', 'artvara/sunrise-wat-chaiwatthanaram', 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1200&auto=format&fit=crop', 185000, 'available'),
('art-03', 'artist-4', 'Lady of the Royal Siamese Court', 'Fine historical portrait of a noblewoman dressed in handwoven gold-threaded sabai and antique royal regalia.', 'Revives the dignified grace of 17th-century Siamese court life through classical chiaroscuro techniques, honoring the silk weavers and cultural emissaries of ancient Ayutthaya.', 2025, 'Oil on Wood Panel', '80 x 110 cm.', 'artvara/lady-court-portrait', 'https://images.unsplash.com/photo-1578925518470-4def7a0f08bb?q=80&w=1200&auto=format&fit=crop', 160000, 'reserved'),
('art-04', 'artist-3', 'Whispers of the Chao Phraya', 'Atmospheric view of historic river trade routes glowing beneath pagoda silhouettes at dusk.', 'Explores the Chao Phraya river as a living artery connecting international maritime traders from Persia, Europe, and Asia to the bustling royal island of Siam.', 2025, 'Acrylic & Gold Leaf on Linen', '100 x 150 cm.', 'artvara/whispers-chao-phraya', 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=1200&auto=format&fit=crop', 140000, 'available'),
('art-05', 'artist-5', 'Sanctuary of the Ancient Bodhi', 'The sacred sandstone Buddha head gently embraced by overgrown Bodhi tree roots at Wat Mahathat.', 'Reflects on the Buddhist philosophy of Anicca (impermanence) and natural harmony, where sacred sandstone sculptures seamlessly merge into living tree roots over centuries.', 2026, 'Mixed Media & Mineral Pigment', '110 x 110 cm.', 'artvara/sanctuary-ancient-bodhi', 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=1200&auto=format&fit=crop', 95000, 'available'),
('art-06', 'artist-6', 'The Golden Chedi in Morning Mist', 'Panoramic composition showcasing the towering main chedi emerging through soft golden haze.', 'Captures the serene solitude of early morning temple grounds in Ayutthaya, meditating on silence, sacred architecture, and spatial infinity.', 2025, 'Oil on Linen', '130 x 190 cm.', 'artvara/golden-chedi-mist', 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=1200&auto=format&fit=crop', 210000, 'sold'),
('art-07', 'artist-7', 'Sacred Stupas & Celestial Horizons', 'Richly textured gold leaf and tempera depicting weathered brick arches reaching toward twilight skies.', 'A cross-cultural Italian-Siamese synthesis investigating architectural proportions, golden ratio geometry, and sacred spiritual ascension across global heritage sites.', 2026, 'Egg Tempera & 24K Gold Leaf on Wood', '100 x 120 cm.', 'artvara/sacred-stupas-celestial', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1200&auto=format&fit=crop', 190000, 'available'),
('art-08', 'artist-8', 'Zenith of Silence (ความเงียบงันแห่งเซน)', 'Monochromatic ink on raw Japanese washi mounted on cedar wood, capturing infinite stillness.', 'Meditates on the void and breath between strokes, creating a visual sanctuary of calm in a chaotic digital world.', 2026, 'Japanese Sumi Ink & Mineral Pigment', '140 x 140 cm.', 'artvara/zenith-silence', 'https://images.unsplash.com/photo-15797839002614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop', 175000, 'available'),
('art-09', 'artist-7', 'Architectonic Luminescence', 'Luminous geometric abstraction inspired by ancient temple archways and Renaissance perspective lines.', 'Exploring structural spirituality through mineral gilding and linear depth.', 2026, 'Oil & Pure Gold Leaf on Linen', '110 x 160 cm.', 'artvara/architectonic-luminescence', 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=1200&auto=format&fit=crop', 210000, 'available');

-- ==========================================================
-- Initial Seed Data: Exhibition Artworks Linking
-- ==========================================================
INSERT INTO exhibition_artworks (exhibition_id, artwork_id, display_order, wall_position) VALUES
('exh-01', 'art-01', 1, '{"x":0,"y":2.0,"z":-6.85,"rotationY":0,"wallIndex":0,"scale":1.2}'),
('exh-01', 'art-02', 2, '{"x":-3.8,"y":2.0,"z":-6.85,"rotationY":0,"wallIndex":0,"scale":1.0}'),
('exh-01', 'art-04', 3, '{"x":3.8,"y":2.0,"z":-6.85,"rotationY":0,"wallIndex":0,"scale":1.0}'),
('exh-01', 'art-03', 4, '{"x":6.85,"y":2.0,"z":-2.8,"rotationY":-1.5707963267948966,"wallIndex":1,"scale":0.9}'),
('exh-01', 'art-06', 5, '{"x":6.85,"y":2.0,"z":2.8,"rotationY":-1.5707963267948966,"wallIndex":1,"scale":1.2}'),
('exh-01', 'art-05', 6, '{"x":-6.85,"y":2.0,"z":-2.8,"rotationY":1.5707963267948966,"wallIndex":3,"scale":1.0}'),
('exh-01', 'art-07', 7, '{"x":-6.85,"y":2.0,"z":2.8,"rotationY":1.5707963267948966,"wallIndex":3,"scale":1.0}'),
('exh-02', 'art-08', 1, '{"x":0,"y":2.0,"z":-6.85,"rotationY":0,"wallIndex":0,"scale":1.2}'),
('exh-02', 'art-09', 2, '{"x":4.0,"y":2.0,"z":-6.85,"rotationY":0,"wallIndex":0,"scale":1.0}'),
('exh-02', 'art-01', 3, '{"x":-4.0,"y":2.0,"z":-6.85,"rotationY":0,"wallIndex":0,"scale":1.0}'),
('exh-03', 'art-04', 1, '{"x":0,"y":2.0,"z":-6.85,"rotationY":0,"wallIndex":0,"scale":1.2}'),
('exh-03', 'art-02', 2, '{"x":4.0,"y":2.0,"z":-6.85,"rotationY":0,"wallIndex":0,"scale":1.0}');
