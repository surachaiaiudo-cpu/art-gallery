# 🎨 Online Art Exhibition & Gallery System (Virtual Gallery & Catalog Generator)

ระบบเว็บแอปพลิเคชันจัดการและแสดงนิทรรศการงานศิลปกรรมออนไลน์ตามวาระ (Curated Exhibition Web Application) ที่สลับการรับชมได้ทั้งแบบ **2D Grid View** และ **3D Virtual Gallery Walkthrough** พร้อมระบบหลังบ้านจัดการหลายศิลปิน คลังนิทรรศการย้อนหลัง และ**ระบบสร้างสูจิบัตรออนไลน์ (E-Catalog / Exhibition Booklet) ในรูปแบบ PDF**

---

## 🏗 Architecture & Tech Stack

ระบบถูกออกแบบให้ทำงานแบบ **Serverless Edge-First Architecture** เพื่อความเร็ว รองรับผู้ใช้งานจำนวนมาก และต้นทุนต่ำ

* **Frontend**: Next.js 14+ (App Router), TailwindCSS, Lucide Icons
* **3D Gallery**: Three.js / React Three Fiber / `@react-three/drei` (สำหรับการแสดงผล 3D Virtual Gallery)
* **PDF Catalog Engine**: `@react-pdf/renderer` หรือ **WeasyPrint / HTML-to-PDF Pipeline** (สำหรับสร้างสูจิบัตร PDF ความละเอียดสูงจากหน้าเว็บ)
* **Backend Framework**: Next.js API Routes / Cloudflare Workers
* **Database**: **Cloudflare D1** (Serverless Relational SQLite Database at the Edge)
* **ORM / Database Client**: **Drizzle ORM** (Lightweight, Type-safe ORM สำหรับ Cloudflare D1)
* **Media Storage**: **Cloudinary** (Image/3D Asset Hosting, Auto Optimization, On-the-fly Resizing)
* **Authentication**: NextAuth.js (v5) / Role-based Access Control (Admin, Curator, Artist, Visitor)

---

## 📊 Database Schema Design (Cloudflare D1)

```sql
-- 1. Table: users (ผู้ใช้งาน, ภัณฑารักษ์, ศิลปิน)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('admin', 'curator', 'artist')) DEFAULT 'artist',
    bio TEXT,
    avatar_url TEXT,
    social_links TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: exhibitions (วาระ/นิทรรศการ)
CREATE TABLE exhibitions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    curator_note TEXT,
    banner_url TEXT,
    catalog_pdf_url TEXT, -- ลิงก์เก็บไฟล์สูจิบัตร PDF ที่สร้างแล้วบน Cloudinary
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status TEXT CHECK(status IN ('upcoming', 'active', 'archived')) DEFAULT 'upcoming',
    theme_config TEXT, -- JSON string สำหรับจัดเลย์เอาต์ห้อง 3D / ธีมสี
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: artworks (ผลงานศิลปะ)
CREATE TABLE artworks (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    year_created INTEGER,
    medium TEXT, -- เช่น Oil on Canvas, Digital, Sculpture
    dimensions TEXT, -- เช่น 100x120 cm
    cloudinary_public_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    model_3d_url TEXT, -- สำหรับไฟล์ 3D assets (.glb/.gltf)
    price REAL,
    status TEXT CHECK(status IN ('available', 'reserved', 'sold', 'not_for_sale')) DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Table: exhibition_artworks (เชื่อมโยงผลงานเข้ากับนิทรรศการตามวาระ)
CREATE TABLE exhibition_artworks (
    exhibition_id TEXT NOT NULL,
    artwork_id TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    wall_position TEXT, -- JSON string สำหรับพิกัดในห้อง 3D x, y, z และ rotation
    PRIMARY KEY (exhibition_id, artwork_id),
    FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id) ON DELETE CASCADE,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- 5. Table: inquiries (ข้อความสอบถาม/จองซื้อจากผู้ชม)
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
```

---

## ⚡ Key Features Roadmap

### 1. Dual Viewing Experience (2D & 3D Dual-Mode)
- 🔀 **Mode Toggle Switch**: ปุ่มสลับมุมมองอย่างรวดเร็วระหว่าง **2D Grid Layout** (อ่านง่าย สบายตา) และ **3D Walkthrough Gallery** (จำลองการเดินชมหอศิลป์)
- 🕶 **3D Virtual Room**: แสดงผลงานบนผนังเสมือนจริงด้วย Three.js / React Three Fiber สามารถคลิกที่ชิ้นงานเพื่อส่องซูม ดูป้ายข้อมูล (Artwork Label) หรือฟังเสียงบรรยาย (Audio Guide)
- 📱 **Mobile Optimized 3D**: ปรับลดทอนโพลีกอนและการส่องแสงในอุปกรณ์มือถือเพื่อความลื่นไหล

### 2. PDF Exhibition Booklet / Catalog Generator (สูจิบัตรดิจิทัล)
- 📖 **Automatic Catalog Building**: ระบบดึงข้อมูลนิทรรศการ คำนำภัณฑารักษ์ รายชื่อศิลปิน และรูปภาพผลงานทั้งหมดมาจัดเลย์เอาต์สูจิบัตรให้อัตโนมัติ
- 📄 **Export to PDF**: ผู้ชมหรือภัณฑารักษ์สามารถกดปุ่ม "Download Catalog (PDF)" ได้ทันที
- 🎨 **Custom Layout Styling**: จัดสไตล์สูจิบัตรอย่างสวยงาม ปรับหน้าปก สารบัญ รูปภาพความละเอียดสูงจาก Cloudinary และรายละเอียดชิ้นงานสไตล์สิ่งพิมพ์จริง

---

## 🛠 Project Setup & Deployment

```bash
# 1. Install Dependencies
npm install

# 2. Cloudflare Wrangler Login
npx wrangler login

# 3. Create Cloudflare D1 Database
npx wrangler d1 create art-gallery-db

# 4. Run Migration Scripts on D1
npx wrangler d1 execute art-gallery-db --file=./schema.sql

# 5. Local Development
npm run dev
```
