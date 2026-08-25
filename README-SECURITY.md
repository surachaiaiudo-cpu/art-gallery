# ARTVARA Security & Authentication Setup

เอกสารแนะนำการกำหนดค่าความปลอดภัยสำหรับระบบจัดการนิทรรศการและสตูดิโอ 3D (Admin Panel & APIs)

---

## 🔐 ภาพรวมระบบความปลอดภัย (Security Architecture)

1. **Edge Middleware (`src/middleware.ts`):**
   - ดักจับทุก Request ที่มุ่งหน้าไปยัง `/admin/*` และ `/api/admin/*`
   - ตรวจสอบความถูกต้องของ Session Cookie (`artvara_admin_session`) ด้วย **Web Crypto HMAC-SHA256**
   - หากไม่มี Cookie หรือ Signature ไม่ถูกต้อง:
     - **API (`/api/admin/*`):** ส่งกลับ `HTTP 401 Unauthorized` ทันที
     - **Page (`/admin/*`):** Redirect ผู้ใช้ไปยัง `/login?from=...`
2. **Image Proxy Allowlist (`src/app/api/image-proxy/route.ts`):**
   - อนุญาตให้ Proxy เฉพาะรูปภาพจากโดเมนที่กำหนด (`ik.imagekit.io`, `res.cloudinary.com`, `images.unsplash.com`, `upload.wikimedia.org`, `flagcdn.com`)
   - ปฏิเสธโดเมนแปลกปลอมด้วย `HTTP 400 Bad Request`

---

## ⚙️ การตั้งค่าตัวแปรสภาพแวดล้อม (Environment Variables)

ระบบใช้ Environment Variables หลัก 2 ตัว:

| ตัวแปร | บทบาท | ค่าเริ่มต้นสำหรับ Local Dev |
|---|---|---|
| `ADMIN_PASSWORD` | รหัสผ่านสำหรับเข้าสู่ระบบ Admin | `admin1234` |
| `AUTH_SECRET` | Secret Key สำหรับเซ็น HMAC-SHA256 Session Cookie (ควรยาว $ge$ 32 ตัวอักษร) | `artvara_secret_local_dev_key_32_chars_long_min` |

---

## 🚀 1. การตั้งค่าบน Cloudflare Pages (Production)

เมื่อ Deploy ขึ้นสู่ Cloudflare Pages ให้กำหนดตัวแปรใน Dashboard ดังนี้:

1. เข้าสู่ **Cloudflare Dashboard** $ightarrow$ **Workers & Pages**
2. เลือกโปรเจกต์ **art-gallery**
3. ไปที่แท็บ **Settings** $ightarrow$ **Environment Variables**
4. เพิ่มตัวแปรสำหรับ **Production**:
   - `ADMIN_PASSWORD` = `<รหัสผ่านจริงที่คุณต้องการใช้ในระบบจริง>`
   - `AUTH_SECRET` = `<สุ่ม Secret Key ความยาว 32-64 ตัวอักษร เช่น ใช้ openssl rand -hex 32>`
5. กด **Save** และระบบจะนำค่า Secret ไปใช้งานใน Deployment ถัดไปทันที

---

## 💻 2. การตั้งค่าสำหรับ Local Development

สำหรับการรันบนเครื่อง Local:

1. หากไม่ได้ตั้งค่าใดๆ ระบบจะมี **Default Fallback** สำหรับ Local Dev คือ:
   - รหัสผ่านเข้าสู่ระบบ: `admin1234`
   - Secret Key: `artvara_secret_local_dev_key_32_chars_long_min`
2. หากต้องการกำหนดรหัสผ่านเฉพาะ ให้เพิ่มในไฟล์ `.dev.vars` หรือ `.env.local`:
   ```env
   ADMIN_PASSWORD=my_custom_local_password
   AUTH_SECRET=my_custom_local_secret_key_32_chars_long_123
   ```

---

## 🧪 การทดสอบระบบความปลอดภัย (Security Verification)

### 1. ทดสอบบล็อก API Admin ที่ไม่มีสิทธิ์:
```bash
curl -I http://localhost:3000/api/admin/exhibitions
# ผลลัพธ์ที่ถูกต้อง: HTTP/1.1 401 Unauthorized
```

### 2. ทดสอบ Image Proxy ปฏิเสธโดเมนภายนอก:
```bash
curl http://localhost:3000/api/image-proxy?url=https://malicious-domain.com/exploit.png
# ผลลัพธ์ที่ถูกต้อง: HTTP/1.1 400 Bad Request {"error":"Domain not allowed..."}
```

### 3. ทดสอบเข้าสู่ระบบ:
- เปิดเบราว์เซอร์ไปที่ `http://localhost:3000/admin`
- ระบบจะ Redirect ไปที่ `http://localhost:3000/login?from=%2Fadmin`
- กรอกรหัสผ่าน `admin1234` $ightarrow$ ระบบจะพาเข้าสู่หน้า Admin ทันที
