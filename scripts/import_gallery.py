#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
ระบบนำเข้าข้อมูลผลงานศิลปะและศิลปิน (Art Gallery Batch Importer)
=============================================================================
โครงสร้างการทำงาน:
  1. ไฟล์ Excel คุมข้อมูลหลัก (ID, ชื่อศิลปิน, ชื่องาน, เทคนิค, ขนาด, ปี, ราคา, ฯลฯ)
  2. โฟลเดอร์ที่ 1: รูปภาพศิลปิน (001.jpg, 002.jpg...)
  3. โฟลเดอร์ที่ 2: รูปภาพผลงาน (001.jpg, 002.jpg...)

การเรียกใช้งานตัวอย่าง:
  python scripts/import_gallery.py --excel ./data.xlsx --artists-dir ./folder_artists --artworks-dir ./folder_artworks
  python scripts/import_gallery.py --excel ./data.xlsx --artists-dir ./folder_artists --artworks-dir ./folder_artworks --api-url http://localhost:3000
=============================================================================
"""

import os
import sys
import re
import time
import json
import argparse
import csv
from datetime import datetime
from difflib import SequenceMatcher

# HTTP requests library
try:
    import requests
except ImportError:
    requests = None

# Optional Excel library (openpyxl or pandas)
try:
    import pandas as pd
except ImportError:
    pd = None

try:
    import openpyxl
except ImportError:
    openpyxl = None


def normalize_string(val: str) -> str:
    """Normalize string by lowercasing and trimming spaces."""
    if not val:
        return ""
    return re.sub(r'\s+', ' ', str(val)).strip().lower()


def clean_key(key: str) -> str:
    """Remove special characters for flexible column name matching."""
    return re.sub(r'[^a-z0-9]', '', str(key).lower())


def get_similarity_ratio(str1: str, str2: str) -> float:
    """Calculate string similarity ratio using difflib."""
    s1 = normalize_string(str1)
    s2 = normalize_string(str2)
    if s1 == s2:
        return 1.0
    return SequenceMatcher(None, s1, s2).ratio()


def extract_prefix_number(filename: str):
    """
    Extracts numerical prefix from a filename.
    e.g. '001.jpg' -> (1, '001')
    e.g. '02_art.png' -> (2, '02')
    e.g. '3.webp' -> (3, '3')
    """
    base_name = os.path.splitext(filename)[0]
    match = re.match(r'^0*(\d+)', base_name)
    if match:
        num = int(match.group(1))
        return num, match.group(0)
    return None, None


def scan_directory_for_images(directory_path: str):
    """
    Scans a directory and returns maps of images by:
    - Numerical ID: { 1: '/path/to/001.jpg', ... }
    - Exact Filename: { '001.jpg': '/path/to/001.jpg', ... }
    - Base Filename: { '001': '/path/to/001.jpg', ... }
    """
    by_number = {}
    by_filename = {}
    by_basename = {}

    if not directory_path or not os.path.isdir(directory_path):
        return by_number, by_filename, by_basename

    supported_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
    for root, _, files in os.walk(directory_path):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in supported_extensions:
                full_path = os.path.join(root, f)
                by_filename[f.lower()] = full_path
                base = os.path.splitext(f)[0].lower()
                by_basename[base] = full_path

                num, _ = extract_prefix_number(f)
                if num is not None and num not in by_number:
                    by_number[num] = full_path

    return by_number, by_filename, by_basename


def read_excel_or_csv(file_path: str):
    """Reads Excel (.xlsx, .xls) or CSV file into a list of dictionaries."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"ไม่พบไฟล์ข้อมูล: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    if ext in ('.xlsx', '.xls'):
        if pd is not None:
            df = pd.read_excel(file_path).fillna('')
            return df.to_dict(orient='records')
        elif openpyxl is not None:
            wb = openpyxl.load_workbook(file_path, data_only=True)
            sheet = wb.active
            rows = list(sheet.iter_rows(values_only=True))
            if not rows:
                return []
            headers = [str(h or '').strip() for h in rows[0]]
            records = []
            for row in rows[1:]:
                rec = {}
                for h, val in zip(headers, row):
                    rec[h] = '' if val is None else str(val).strip()
                records.append(rec)
            return records
        else:
            raise ImportError("กรุณาติดตั้ง pandas หรือ openpyxl สำหรับอ่านไฟล์ Excel (`pip install openpyxl pandas`)")

    elif ext == '.csv':
        encodings = ['utf-8-sig', 'utf-8', 'cp874', 'latin-1']
        for enc in encodings:
            try:
                with open(file_path, mode='r', encoding=enc) as f:
                    reader = csv.DictReader(f)
                    return list(reader)
            except UnicodeDecodeError:
                continue
        raise ValueError("ไม่สามารถอ่านไฟล์ CSV ด้วยการเข้ารหัสที่รองรับได้")
    else:
        raise ValueError(f"ชนิดไฟล์ไม่รองรับ: {ext} (รองรับเฉพาะ .xlsx, .xls, .csv)")


class GalleryBatchImporter:
    def __init__(self, api_base_url="http://localhost:3000", fuzzy_threshold=0.85):
        self.api_base_url = api_base_url.rstrip('/')
        self.fuzzy_threshold = fuzzy_threshold
        self.session = requests.Session() if requests else None

    def fetch_existing_artists(self):
        """Fetches all artists currently in the database via REST API."""
        if not self.session:
            return []
        url = f"{self.api_base_url}/api/admin/artists"
        try:
            res = self.session.get(url, timeout=10)
            if res.ok:
                data = res.json()
                return data.get('artists', [])
        except Exception as e:
            print(f"⚠️ ไม่สามารถดึงรายชื่อศิลปินเดิมจาก API ({url}): {e}")
        return []

    def upload_image(self, file_path: str, folder="/artvara-artworks"):
        """Uploads a local image file to the gallery upload API."""
        if not self.session:
            raise RuntimeError("กรุณาติดตั้ง library requests (`pip install requests`)")

        url = f"{self.api_base_url}/api/admin/upload"
        filename = os.path.basename(file_path)
        with open(file_path, 'rb') as f:
            files = {'file': (filename, f, 'image/jpeg')}
            data = {
                'folder': folder,
                'fileName': os.path.splitext(filename)[0]
            }
            res = self.session.post(url, files=files, data=data, timeout=30)
            if not res.ok:
                raise RuntimeError(f"อัปโหลดไฟล์ภาพล้มเหลว ({res.status_code}): {res.text}")
            res_data = res.json()
            return res_data.get('url')

    def submit_batch(self, items, exhibition_id=None):
        """Sends batch artwork items to the batch import API."""
        if not self.session:
            raise RuntimeError("กรุณาติดตั้ง library requests (`pip install requests`)")

        url = f"{self.api_base_url}/api/admin/artworks/batch"
        payload = {
            'items': items,
            'exhibitionId': exhibition_id
        }
        res = self.session.post(url, json=payload, timeout=60)
        if not res.ok:
            raise RuntimeError(f"การบันทึก Batch ลงฐานข้อมูลล้มเหลว: {res.text}")
        return res.json()


def run_import(excel_path, artists_dir, artworks_dir, api_url, exhibition_id=None, fuzzy_threshold=0.85):
    print("=" * 70)
    print("🎨 เริ่มต้นระบบนำเข้าข้อมูลหอศิลป์ออนไลน์ (Online Art Gallery Importer)")
    print("=" * 70)
    print(f"📄 ไฟล์ตารางข้อมูล : {excel_path}")
    print(f"👤 โฟลเดอร์รูปศิลปิน : {artists_dir}")
    print(f"🎨 โฟลเดอร์รูปผลงาน : {artworks_dir}")
    print(f"🌐 API Endpoint    : {api_url}")
    print("-" * 70)

    # 1. Scan image folders
    print("🔍 กำลังสแกนโฟลเดอร์รูปภาพ...")
    artist_by_num, artist_by_fn, artist_by_bn = scan_directory_for_images(artists_dir)
    artwork_by_num, artwork_by_fn, artwork_by_bn = scan_directory_for_images(artworks_dir)

    print(f"  • พบรูปศิลปินทั้งหมด : {len(artist_by_fn)} ไฟล์")
    print(f"  • พบรูปผลงานทั้งหมด : {len(artwork_by_fn)} ไฟล์")

    # 2. Read Excel rows
    print("📖 กำลังอ่านตารางข้อมูล Excel...")
    raw_rows = read_excel_or_csv(excel_path)
    print(f"  • อ่านข้อมูลได้ทั้งหมด : {len(raw_rows)} แถว\n")

    # 3. Fetch existing artists from DB
    importer = GalleryBatchImporter(api_base_url=api_url, fuzzy_threshold=fuzzy_threshold)
    existing_artists = importer.fetch_existing_artists()
    print(f"👥 พบศิลปินในระบบเดิมแล้ว : {len(existing_artists)} ท่าน")
    print("=" * 70)

    processed_items = []
    audit_logs = []
    success_count = 0
    skip_count = 0

    for idx, row in enumerate(raw_rows):
        row_num = idx + 1
        
        # Parse fields dynamically
        id_val = ""
        artist_name = ""
        artist_country = "Thailand"
        artist_bio = ""
        artwork_title = ""
        year_created = "2026"
        medium = "Mixed Media"
        dimensions = "100 x 100 cm."
        price = "0"
        concept = ""
        custom_artist_photo = ""
        custom_artwork_photo = ""

        for k, v in row.items():
            val = str(v).strip()
            ck = clean_key(k)
            if ck in ('id', 'no', 'num', 'ลำดับ', 'รหัส', 'code'):
                id_val = val
            elif ck in ('artistname', 'artist', 'ชื่อศิลปิน', 'ศิลปิน', 'name', 'creator'):
                artist_name = val
            elif ck in ('country', 'artistcountry', 'ประเทศ', 'สัญชาติ'):
                artist_country = val or "Thailand"
            elif ck in ('bio', 'artistbio', 'ประวัติ', 'ประวัติศิลปิน'):
                artist_bio = val
            elif ck in ('artworktitle', 'title', 'ชื่องาน', 'ชื่อผลงาน', 'ผลงาน'):
                artwork_title = val
            elif ck in ('year', 'yearcreated', 'ปี', 'ปีที่สร้าง'):
                year_created = val or "2026"
            elif ck in ('medium', 'technique', 'เทคนิค', 'วัสดุ'):
                medium = val or "Mixed Media"
            elif ck in ('dimensions', 'dimension', 'size', 'ขนาด'):
                dimensions = val or "100 x 100 cm."
            elif ck in ('price', 'ราคา'):
                price = val or "0"
            elif ck in ('concept', 'description', 'แนวคิด', 'คำบรรยาย'):
                concept = val
            elif ck in ('artistphoto', 'artistimage', 'รูปศิลปิน'):
                custom_artist_photo = val
            elif ck in ('artworkphoto', 'artworkimage', 'รูปผลงาน'):
                custom_artwork_photo = val

        if not artist_name and not artwork_title:
            continue

        numeric_id = int(re.sub(r'\D', '', id_val)) if re.sub(r'\D', '', id_val) else row_num
        display_id_str = id_val or f"{row_num:03d}"

        if not artwork_title:
            artwork_title = f"ผลงานของ {artist_name} (#{display_id_str})" if artist_name else f"ผลงานศิลปกรรม #{display_id_str}"
        if not artist_name:
            artist_name = "ศิลปินร่วมแสดง"

        print(f"\n▶ [แถวที่ {row_num}] รหัส #{display_id_str}: \"{artwork_title}\" โดย {artist_name}")

        # Match Artist Image
        matched_artist_file = None
        if custom_artist_photo and custom_artist_photo.lower() in artist_by_fn:
            matched_artist_file = artist_by_fn[custom_artist_photo.lower()]
        elif numeric_id in artist_by_num:
            matched_artist_file = artist_by_num[numeric_id]
        elif display_id_str.lower() in artist_by_bn:
            matched_artist_file = artist_by_bn[display_id_str.lower()]

        # Match Artwork Image
        matched_artwork_file = None
        if custom_artwork_photo and custom_artwork_photo.lower() in artwork_by_fn:
            matched_artwork_file = artwork_by_fn[custom_artwork_photo.lower()]
        elif numeric_id in artwork_by_num:
            matched_artwork_file = artwork_by_num[numeric_id]
        elif display_id_str.lower() in artwork_by_bn:
            matched_artwork_file = artwork_by_bn[display_id_str.lower()]

        if not matched_artwork_file:
            print(f"  ❌ ไม่พบรูปผลงานสำหรับรหัส #{display_id_str} ในโฟลเดอร์ผลงาน -> ข้ามแถวนี้")
            audit_logs.append({
                'row': row_num,
                'id': display_id_str,
                'artist': artist_name,
                'artwork': artwork_title,
                'status': 'SKIPPED_MISSING_ARTWORK_IMAGE',
                'detail': f'ไม่พบไฟล์รูปผลงาน {display_id_str}.jpg'
            })
            skip_count += 1
            continue

        # Check existing artist
        norm_name = normalize_string(artist_name)
        matched_artist = None
        for a in existing_artists:
            db_name = normalize_string(a.get('name', ''))
            if db_name == norm_name or get_similarity_ratio(db_name, norm_name) >= fuzzy_threshold:
                matched_artist = a
                break

        if matched_artist:
            print(f"  ✓ ตรวจพบศิลปินเดิมในระบบ: {matched_artist.get('name')} (ID: {matched_artist.get('id')})")
        else:
            print(f"  ✨ ศิลปินใหม่: {artist_name} ({artist_country})")

        # Upload images
        try:
            artist_avatar_url = None
            if matched_artist_file:
                print(f"  📤 กำลังอัปโหลดรูปศิลปิน: {os.path.basename(matched_artist_file)}...")
                artist_avatar_url = importer.upload_image(matched_artist_file, folder="/artvara-artists")
                print("  ✓ อัปโหลดรูปศิลปินสำเร็จ")

            print(f"  📤 กำลังอัปโหลดรูปผลงาน: {os.path.basename(matched_artwork_file)}...")
            artwork_image_url = importer.upload_image(matched_artwork_file, folder="/artvara-artworks")
            print("  ✓ อัปโหลดรูปผลงานสำเร็จ")

            processed_items.append({
                'title': artwork_title,
                'artistName': artist_name,
                'artistCountry': artist_country,
                'artistBio': artist_bio,
                'artistAvatarUrl': artist_avatar_url,
                'medium': medium,
                'dimensions': dimensions,
                'yearCreated': year_created,
                'concept': concept,
                'price': price,
                'imageUrl': artwork_image_url
            })

            audit_logs.append({
                'row': row_num,
                'id': display_id_str,
                'artist': artist_name,
                'artwork': artwork_title,
                'status': 'READY_FOR_INSERT',
                'detail': 'อัปโหลดภาพและแมตช์ข้อมูลสำเร็จ'
            })
            success_count += 1

        except Exception as upload_err:
            print(f"  ❌ อัปโหลดรูปภาพล้มเหลว: {upload_err}")
            audit_logs.append({
                'row': row_num,
                'id': display_id_str,
                'artist': artist_name,
                'artwork': artwork_title,
                'status': 'UPLOAD_ERROR',
                'detail': str(upload_err)
            })
            skip_count += 1

    # Batch submit to DB API
    if processed_items:
        print("\n" + "=" * 70)
        print(f"💾 กำลังบันทึกข้อมูล {len(processed_items)} รายการเข้าสู่ฐานข้อมูล D1...")
        try:
            db_res = importer.submit_batch(processed_items, exhibition_id=exhibition_id)
            print(f"🎉 บันทึกข้อมูลลงฐานข้อมูลสำเร็จ! (รวม {db_res.get('count', len(processed_items))} รายการ)")
        except Exception as db_err:
            print(f"❌ เกิดข้อผิดพลาดในการบันทึกฐานข้อมูล: {db_err}")

    # Generate Audit CSV Report
    report_filename = f"import_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    with open(report_filename, mode='w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=['row', 'id', 'artist', 'artwork', 'status', 'detail'])
        writer.writeheader()
        writer.writerows(audit_logs)

    print("\n" + "=" * 70)
    print("🏁 สรุปผลการประมวลผลการนำเข้าข้อมูล:")
    print(f"  • นำเข้าสำเร็จ : {success_count} รายการ")
    print(f"  • ข้าม/ล้มเหลว : {skip_count} รายการ")
    print(f"  • บันทึกรายงาน Audit Log ที่ไฟล์: {report_filename}")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(
        description="ระบบนำเข้าข้อมูลรูปภาพศิลปินและผลงานเข้าสู่หอศิลป์ออนไลน์ผ่าน Excel"
    )
    parser.add_argument('--excel', required=True, help="พาธของไฟล์ตารางข้อมูล Excel (.xlsx, .xls, .csv)")
    parser.add_argument('--artists-dir', required=False, default="", help="พาธโฟลเดอร์เก็บรูปโปรไฟล์ศิลปิน (001.jpg, 002.jpg...)")
    parser.add_argument('--artworks-dir', required=True, help="พาธโฟลเดอร์เก็บรูปภาพผลงาน (001.jpg, 002.jpg...)")
    parser.add_argument('--api-url', required=False, default="http://localhost:3000", help="Base URL ของระบบหอศิลป์ (ค่าเริ่มต้น: http://localhost:3000)")
    parser.add_argument('--exhibition-id', required=False, default="", help="รหัส Exhibition ID ที่ต้องการผูกผลงาน (ตัวเลือก)")
    parser.add_argument('--fuzzy', type=float, default=0.85, help="เกณฑ์ความคล้ายในการตรวจชื่อศิลปินซ้ำ (0.50 - 1.00)")

    args = parser.parse_args()

    run_import(
        excel_path=args.excel,
        artists_dir=args.artists_dir,
        artworks_dir=args.artworks_dir,
        api_url=args.api_url,
        exhibition_id=args.exhibition_id or None,
        fuzzy_threshold=args.fuzzy
    )


if __name__ == '__main__':
    main()
