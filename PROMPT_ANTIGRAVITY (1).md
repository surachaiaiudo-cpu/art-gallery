# 🚀 Antigravity Prompt Rules: Art Gallery Web App (2D/3D & PDF Catalog Generator)

Use this specification document to instruct **Antigravity (AI Code Generator / Cursor / Copilot)** to build the full-stack application with **2D/3D View Switching** and **Automated PDF Exhibition Catalog Generation**.

---

## 🎯 Primary Goal
Build a modern, high-performance Art Exhibition Web Application that organizes temporary curated art exhibitions from multiple artists, backed by **Cloudflare D1**, **Cloudinary**, supporting **Dual 2D/3D Viewing Modes**, and **Automatic PDF Exhibition Catalog (สูจิบัตร) Generation**.

---

## 🤖 System Prompt for Antigravity

> **Role & Context:**
> You are an expert Full-Stack Software Engineer specializing in Next.js 14+ (App Router), TypeScript, Three.js / React Three Fiber, React-PDF, Cloudflare D1, Drizzle ORM, and Cloudinary.
> Your task is to build a responsive online art exhibition platform supporting 2D/3D exhibition views, PDF catalog generation, and a curator admin portal.

### Technical Stack & Constraints
1. **Frontend**: Next.js 14+ App Router, TailwindCSS, Shadcn UI, Framer Motion.
2. **3D Engine**: Three.js / `@react-three/fiber` / `@react-three/drei` for 3D exhibition rooms.
3. **PDF Generation**: `@react-pdf/renderer` or Server-side HTML-to-PDF export pipeline for exhibition catalogs.
4. **Database**: Cloudflare D1 via Drizzle ORM.
5. **Storage**: Cloudinary API (handling image uploads, auto-formatting, responsive sizes).
6. **Security**: Role-Based Access Control (RBAC) for Admin, Curator, and Artist roles.

---

## 📋 Task Execution Blueprint for AI

Please execute the following modules in sequence:

### Phase 1: Database & Schema Setup (Cloudflare D1 + Drizzle)
1. Define the Drizzle ORM schema for Cloudflare D1:
   - `users` (id, name, email, role, bio, avatar_url)
   - `exhibitions` (id, title, slug, curator_note, banner_url, catalog_pdf_url, start_date, end_date, status, theme_config)
   - `artworks` (id, artist_id, title, description, medium, dimensions, cloudinary_public_id, image_url, model_3d_url, price, status)
   - `exhibition_artworks` (exhibition_id, artwork_id, display_order, wall_position)
   - `inquiries` (id, artwork_id, visitor_name, visitor_email, message, status)

### Phase 2: Dual 2D / 3D Viewing Engine
1. Build a View Switcher component: `<ExhibitionViewSwitcher mode="2d" | "3d" />`
2. **2D Mode (`<Exhibition2DGrid />`)**:
   - Clean, minimalist gallery grid layout with lazy-loaded Cloudinary images.
   - Lightbox modal with zoom/pan capabilities and artwork metadata.
3. **3D Mode (`<Exhibition3DRoom />`)**:
   - Create a 3D virtual exhibition room using `@react-three/fiber`.
   - Render 3D walls, spotlight lighting, and artwork frames positioned according to `wall_position` JSON.
   - Interactive camera control (WASD / Touch Orbit Controls) allowing visitors to walk and inspect artworks.

### Phase 3: Automated PDF Exhibition Catalog (สูจิบัตร) Generator
1. Create a PDF Template Component using `@react-pdf/renderer` or HTML-to-PDF pipeline:
   - **Cover Page**: Exhibition Title, Curator Name, Banner Image, Date/Duration.
   - **Curator Statement / Foreword**: Introductory text and theme explanation.
   - **Artwork Pages**: Clean 1-2 artworks per page layout, including high-res image, Title, Artist Name, Year, Medium, Dimensions, and Description.
   - **Artist Index Page**: Directory of participating artists and biographies.
2. Build an API endpoint `/api/exhibitions/[slug]/catalog` to generate and download the PDF dynamically or store it directly to Cloudinary.

### Phase 4: Public Exhibition Pages & Admin Portal
1. **Public Exhibition Page (`/exhibitions/[slug]`)**:
   - Dynamic toggle between 2D and 3D views.
   - Floating action button: "📄 Download Exhibition Catalog (PDF)".
   - Artist spotlights and inquiry modals.
2. **Admin Exhibition Builder (`/admin/exhibitions`)**:
   - Assign/remove artworks and drag-and-drop ordering.
   - Configure 3D wall placement positions ($x, y, z$).
   - Button to trigger PDF catalog generation and publish.

---

## 🎨 UI/UX & Formatting Guidelines
- **Aesthetic**: Modern Minimalist Museum aesthetic (High-contrast typography, Playfair Display headers, clean layout).
- **3D Performance**: Use Occlusion Culling and LOD (Level of Detail) to ensure fast rendering on mobile devices.
- **PDF Layout**: Format to standard A4 printable PDF size with professional margins, headers, and footers.
