'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  FolderOpen,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  User,
  Palette,
  ArrowRight,
  RefreshCw,
  Eye,
  Trash2,
  Download,
  Check,
  Layers,
  ArrowLeft,
  Info,
  ClipboardPaste,
  FileUp,
  ImageIcon,
} from 'lucide-react';
import { Exhibition } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';

interface MatchedImportItem {
  id: string;
  rowIndex: number;
  rowIdStr: string;
  selected: boolean;
  
  // Artist Data
  artistName: string;
  artistCountry: string;
  artistEmail?: string;
  artistBio: string;
  matchedExistingArtistId?: string;
  matchedExistingArtistName?: string;
  isNewArtist: boolean;
  
  // Artist Photo
  artistFile?: File;
  artistPreviewUrl?: string;
  artistFileName?: string;
  
  // Artwork Data
  artworkTitle: string;
  yearCreated: string;
  medium: string;
  dimensions: string;
  price: string;
  concept: string;
  
  // Artwork Photo
  artworkFile?: File;
  artworkPreviewUrl?: string;
  artworkFileName?: string;
  
  // Status
  status: 'ready' | 'warning' | 'error' | 'success' | 'failed';
  statusMessage: string;
}

interface ExistingArtist {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  country?: string;
}

interface BatchImportManagerProps {
  exhibitions?: Exhibition[];
  initialExhibitionId?: string;
  isModalMode?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function BatchImportManager({
  exhibitions = [],
  initialExhibitionId = '',
  isModalMode = false,
  onSuccess,
  onClose,
}: BatchImportManagerProps) {
  const { lang } = useLanguage();

  // Target Exhibitions
  const [exhibitionsList, setExhibitionsList] = useState<Exhibition[]>(exhibitions);
  const [targetExhibitionId, setTargetExhibitionId] = useState<string>(initialExhibitionId);

  // Input Mode for Excel Data (File vs Paste Text)
  const [excelInputMode, setExcelInputMode] = useState<'file' | 'paste'>('file');
  const [pastedExcelText, setPastedExcelText] = useState<string>('');

  // Fetch exhibitions if not provided
  useEffect(() => {
    if (exhibitions && exhibitions.length > 0) {
      setExhibitionsList(exhibitions);
    } else {
      fetch('/api/admin/exhibitions')
        .then((res) => res.json())
        .then((data) => {
          if (data.exhibitions && Array.isArray(data.exhibitions)) {
            setExhibitionsList(data.exhibitions);
          }
        })
        .catch((err) => console.warn('Could not fetch exhibitions:', err));
    }
  }, [exhibitions]);

  // Files state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [artistFiles, setArtistFiles] = useState<File[]>([]);
  const [artworkFiles, setArtworkFiles] = useState<File[]>([]);

  // Existing Artists from DB
  const [existingArtists, setExistingArtists] = useState<ExistingArtist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState<boolean>(true);

  // Matched items for preview
  const [matchedItems, setMatchedItems] = useState<MatchedImportItem[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);

  // Zoom Lightbox State
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [zoomImageTitle, setZoomImageTitle] = useState<string>('');

  // Import Execution State
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [currentImportStep, setCurrentImportStep] = useState<string>('');
  const [importLogs, setImportLogs] = useState<Array<{ type: 'info' | 'success' | 'warn' | 'error'; message: string }>>([]);
  const [importCompleted, setImportCompleted] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    success: number;
    failed: number;
    newArtists: number;
  }>({ total: 0, success: 0, failed: 0, newArtists: 0 });

  // File Inputs Refs
  const excelInputRef = useRef<HTMLInputElement>(null);
  const artistFileInputRef = useRef<HTMLInputElement>(null);
  const artistFolderInputRef = useRef<HTMLInputElement>(null);
  const artworkFileInputRef = useRef<HTMLInputElement>(null);
  const artworkFolderInputRef = useRef<HTMLInputElement>(null);

  // Drag over states
  const [isArtistDragOver, setIsArtistDragOver] = useState(false);
  const [isArtworkDragOver, setIsArtworkDragOver] = useState(false);
  const [isExcelDragOver, setIsExcelDragOver] = useState(false);

  // Sync initial exhibition id
  useEffect(() => {
    if (initialExhibitionId) {
      setTargetExhibitionId(initialExhibitionId);
    }
  }, [initialExhibitionId]);

  // Load existing artists on mount
  useEffect(() => {
    async function fetchArtists() {
      try {
        setLoadingArtists(true);
        const res = await fetch('/api/admin/artists');
        if (res.ok) {
          const data = await res.json();
          setExistingArtists(data.artists || []);
        }
      } catch (err) {
        console.error('Failed to load existing artists:', err);
      } finally {
        setLoadingArtists(false);
      }
    }
    fetchArtists();
  }, []);

  // Normalization helper
  const cleanKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Dimensions cleaner & unit normalizer
  const cleanDimensions = (rawDim: string): string => {
    if (!rawDim) return '100 x 100 cm.';
    let cleaned = rawDim.trim();

    // Check if inches specified
    if (/inch|inches|นิ้ว/i.test(cleaned)) {
      cleaned = cleaned.replace(/(inches?|นิ้ว|\.)/gi, '').trim();
      cleaned = cleaned.replace(/\s*[xX*×]\s*/g, ' x ').trim();
      return `${cleaned} Inches`;
    }

    // Strip duplicate cm/ซม units from raw input
    cleaned = cleaned.replace(/(cm\.?|cms\.?|ซม\.?|เซนติเมตร)/gi, '').trim();
    cleaned = cleaned.replace(/\s*[xX*×]\s*/g, ' x ').trim();

    // If it contains numbers (dimensions), append standard "cm."
    if (/\d/.test(cleaned)) {
      return `${cleaned} cm.`;
    }

    return cleaned || '100 x 100 cm.';
  };

  // Extract Prefix Number from filename e.g. "p003.jpg" -> 3, "001.jpg" -> 1, "P005.png" -> 5
  const extractPrefixNumber = (filename: string): { num: number; prefixStr: string } | null => {
    const base = filename.split('.')[0] || '';
    // Match digits anywhere in base filename, e.g. p003 -> 3, 001 -> 1, art_05 -> 5
    const match = base.match(/(\d+)/);
    if (match && match[1]) {
      return {
        num: parseInt(match[1], 10),
        prefixStr: match[1],
      };
    }
    return null;
  };

  // Re-process matching whenever Excel data or image files change
  useEffect(() => {
    if (excelInputMode === 'file') {
      if (!excelFile) {
        setMatchedItems([]);
        return;
      }
      processMatchingFile(excelFile, artistFiles, artworkFiles, existingArtists);
    } else {
      if (!pastedExcelText.trim()) {
        setMatchedItems([]);
        return;
      }
      processMatchingText(pastedExcelText, artistFiles, artworkFiles, existingArtists);
    }
  }, [excelFile, pastedExcelText, excelInputMode, artistFiles, artworkFiles, existingArtists]);

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
    }
  };

  const handleArtistFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((f) =>
        /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)
      );
      setArtistFiles(files);
    }
  };

  const handleArtworkFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((f) =>
        /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)
      );
      setArtworkFiles(files);
    }
  };

  // Parse TSV / Tabular Pasted Text from Excel (Quote-aware & multiline safe)
  const parseTabularText = (text: string): any[] => {
    if (!text.trim()) return [];

    // 1. Split lines respecting quotes (Excel multi-line cells)
    const rawLines: string[] = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        currentLine += char;
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && text[i + 1] === '\n') {
          i++; // skip \n
        }
        if (currentLine.trim().length > 0) {
          rawLines.push(currentLine);
        }
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    if (currentLine.trim().length > 0) {
      rawLines.push(currentLine);
    }

    if (rawLines.length === 0) return [];

    const delimiter = rawLines[0].includes('\t') ? '\t' : rawLines[0].includes(',') ? ',' : '\t';
    const firstLineCells = rawLines[0].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));

    // Check if first line is header or data
    const isHeader = firstLineCells.some((c) =>
      ['artist', 'name', 'ศิลปิน', 'title', 'ชื่องาน', 'id', 'ลำดับ', 'medium', 'เทคนิค', 'country', 'ประเทศ'].includes(cleanKey(c))
    );

    let headers: string[];
    if (isHeader) {
      headers = firstLineCells;
    } else {
      // Auto-detect if first column is numeric ID or Artist Name
      const firstCell = firstLineCells[0] || '';
      const isFirstCellNumericId = /^\d+$/.test(firstCell) || /^no\.?\s*\d+/i.test(firstCell) || /^[a-z]?\d{1,4}$/i.test(firstCell);

      if (isFirstCellNumericId) {
        headers = ['ID', 'ArtistName', 'Country', 'ArtistEmail', 'ArtworkTitle', 'Medium', 'Dimensions', 'Year', 'Price', 'Concept', 'Bio'];
      } else {
        // First column is Artist Name (no ID column)
        headers = ['ArtistName', 'Country', 'ArtistEmail', 'ArtworkTitle', 'Medium', 'Dimensions', 'Year', 'Price', 'Concept', 'Bio'];
      }
    }

    const dataLines = isHeader ? rawLines.slice(1) : rawLines;

    return dataLines.map((line, lineIdx) => {
      const cells = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const obj: any = {};
      
      // Auto-fill row sequence ID if no ID header
      if (!headers.includes('ID') && !headers.includes('id') && !headers.includes('ลำดับ')) {
        obj['ID'] = String(lineIdx + 1).padStart(3, '0');
      }

      headers.forEach((h, i) => {
        obj[h] = cells[i] !== undefined ? cells[i] : '';
      });
      return obj;
    });
  };

  const processMatchingText = (
    text: string,
    artistImgFiles: File[],
    artworkImgFiles: File[],
    artistsPool: ExistingArtist[]
  ) => {
    setIsProcessingFiles(true);
    try {
      const rawJson = parseTabularText(text);
      buildMatchedResults(rawJson, artistImgFiles, artworkImgFiles, artistsPool);
    } catch (err) {
      console.error('Error parsing pasted text:', err);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const processMatchingFile = async (
    file: File,
    artistImgFiles: File[],
    artworkImgFiles: File[],
    artistsPool: ExistingArtist[]
  ) => {
    setIsProcessingFiles(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

      buildMatchedResults(rawJson, artistImgFiles, artworkImgFiles, artistsPool);
    } catch (error) {
      console.error('Error parsing Excel and matching:', error);
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel กรุณาตรวจสอบรูปแบบไฟล์');
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const buildMatchedResults = (
    rawJson: any[],
    artistImgFiles: File[],
    artworkImgFiles: File[],
    artistsPool: ExistingArtist[]
  ) => {
    if (rawJson.length === 0) {
      setMatchedItems([]);
      return;
    }

    // Sort files naturally: 001.jpg, 002.jpg, ... 010.jpg
    const sortedArtistFiles = [...artistImgFiles].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
    const sortedArtworkFiles = [...artworkImgFiles].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    // Build Maps for Artist Images
    const artistMapByNum = new Map<number, File>();
    const artistMapByName = new Map<string, File>();
    for (const f of artistImgFiles) {
      const p = extractPrefixNumber(f.name);
      if (p) artistMapByNum.set(p.num, f);
      artistMapByName.set(f.name.toLowerCase(), f);
      artistMapByName.set(f.name.split('.')[0].toLowerCase(), f);
    }

    // Build Maps for Artwork Images
    const artworkMapByNum = new Map<number, File>();
    const artworkMapByName = new Map<string, File>();
    for (const f of artworkImgFiles) {
      const p = extractPrefixNumber(f.name);
      if (p) artworkMapByNum.set(p.num, f);
      artworkMapByName.set(f.name.toLowerCase(), f);
      artworkMapByName.set(f.name.split('.')[0].toLowerCase(), f);
    }

    const results: MatchedImportItem[] = [];

    rawJson.forEach((row: any, idx: number) => {
      const rowNum = idx + 1; // 1-based sequential row

      let idVal = '';
      let artistName = '';
      let artistCountry = 'Thailand';
      let artistEmail = '';
      let artistBio = '';
      let artworkTitle = '';
      let yearCreated = '2026';
      let medium = 'Mixed Media';
      let dimensions = '100 x 100 cm.';
      let price = '';
      let concept = '';
      let customArtistPhoto = '';
      let customArtworkPhoto = '';

      for (const [k, v] of Object.entries(row)) {
        const val = String(v).trim();
        const ck = cleanKey(k);

        if (['id', 'no', 'num', 'ลำดับ', 'รหัส', 'code'].includes(ck)) {
          idVal = val;
        } else if (['artistname', 'artist', 'ชื่อศิลปิน', 'ศิลปิน', 'name', 'creator'].includes(ck)) {
          artistName = val;
        } else if (['country', 'artistcountry', 'ประเทศ', 'สัญชาติ', 'nation'].includes(ck)) {
          artistCountry = val || 'Thailand';
        } else if (['email', 'artistemail', 'อีเมล'].includes(ck) || (val.includes('@') && val.includes('.'))) {
          artistEmail = val;
        } else if (['bio', 'artistbio', 'ประวัติ', 'ประวัติศิลปิน'].includes(ck)) {
          artistBio = val;
        } else if (['artworktitle', 'title', 'ชื่องาน', 'ชื่อผลงาน', 'ผลงาน', 'artwork'].includes(ck)) {
          artworkTitle = val;
        } else if (['year', 'yearcreated', 'ปี', 'ปีที่สร้าง'].includes(ck)) {
          if (/^\d{4}$/.test(val)) {
            yearCreated = val;
          } else if (/^(cm|inches|inch|ซม|มม|\.)$/i.test(val)) {
            // Unit column from Excel
            dimensions = cleanDimensions(`${dimensions} ${val}`);
          } else {
            concept = concept ? `${concept} | ${val}` : val;
          }
        } else if (['medium', 'technique', 'เทคนิค', 'วัสดุ'].includes(ck)) {
          medium = val || 'Mixed Media';
        } else if (['dimensions', 'dimension', 'size', 'ขนาด'].includes(ck)) {
          dimensions = cleanDimensions(val);
        } else if (['price', 'ราคา', 'มูลค่า'].includes(ck)) {
          const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
          if (!isNaN(parsed) && parsed > 0) {
            price = String(parsed);
          } else if (val && val !== 'cm.' && val !== 'cm') {
            concept = concept ? `${concept} | ${val}` : val;
          }
        } else if (['concept', 'description', 'แนวคิด', 'คำบรรยาย', 'รายละเอียด'].includes(ck)) {
          concept = concept ? `${concept} | ${val}` : val;
        } else if (['artistphoto', 'artistimage', 'รูปศิลปิน', 'ภาพศิลปิน'].includes(ck)) {
          customArtistPhoto = val;
        } else if (['artworkphoto', 'artworkimage', 'รูปผลงาน', 'ภาพผลงาน', 'image', 'photo'].includes(ck)) {
          customArtworkPhoto = val;
        }
      }

      // Final dimensions normalization (strips any duplicate cm./ซม. units)
      dimensions = cleanDimensions(dimensions);

      // Safe numeric ID extraction
      const digitsOnly = idVal.replace(/\D/g, '');
      const numericId = digitsOnly ? parseInt(digitsOnly, 10) : rowNum;
      const displayIdStr = digitsOnly ? digitsOnly.padStart(3, '0') : String(rowNum).padStart(3, '0');

      if (!artistName) {
        artistName = `ศิลปินลำดับที่ ${displayIdStr}`;
      }
      if (!artworkTitle) {
        artworkTitle = artistName ? `ผลงานของ ${artistName} (#${displayIdStr})` : `ผลงานศิลปกรรม #${displayIdStr}`;
      }

      // 1. Match Artist Photo (Strict by ID/Number/Name - No Index Shifting)
      let matchedArtistFile: File | undefined;
      if (customArtistPhoto && artistMapByName.has(customArtistPhoto.toLowerCase())) {
        matchedArtistFile = artistMapByName.get(customArtistPhoto.toLowerCase());
      } else if (artistMapByNum.has(numericId)) {
        matchedArtistFile = artistMapByNum.get(numericId);
      } else if (artistMapByName.has(displayIdStr.toLowerCase())) {
        matchedArtistFile = artistMapByName.get(displayIdStr.toLowerCase());
      } else if (artistMapByName.has(`p${displayIdStr.toLowerCase()}`)) {
        matchedArtistFile = artistMapByName.get(`p${displayIdStr.toLowerCase()}`);
      } else if (artistMapByName.has(artistName.toLowerCase())) {
        matchedArtistFile = artistMapByName.get(artistName.toLowerCase());
      }

      // 2. Match Artwork Photo (Strict by ID/Number/Name - No Index Shifting)
      let matchedArtworkFile: File | undefined;
      if (customArtworkPhoto && artworkMapByName.has(customArtworkPhoto.toLowerCase())) {
        matchedArtworkFile = artworkMapByName.get(customArtworkPhoto.toLowerCase());
      } else if (artworkMapByNum.has(numericId)) {
        matchedArtworkFile = artworkMapByNum.get(numericId);
      } else if (artworkMapByName.has(displayIdStr.toLowerCase())) {
        matchedArtworkFile = artworkMapByName.get(displayIdStr.toLowerCase());
      } else if (artworkMapByName.has(`p${displayIdStr.toLowerCase()}`)) {
        matchedArtworkFile = artworkMapByName.get(`p${displayIdStr.toLowerCase()}`);
      } else if (artworkMapByName.has(artworkTitle.toLowerCase())) {
        matchedArtworkFile = artworkMapByName.get(artworkTitle.toLowerCase());
      }

      // 3. Artist Detection with Existing DB
      let isNewArtist = true;
      let matchedExistingArtistId: string | undefined;
      let matchedExistingArtistName: string | undefined;

      const normInputName = artistName.toLowerCase().replace(/\s+/g, ' ').trim();
      const found = artistsPool.find((a) => {
        const normDbName = (a.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
        return normDbName === normInputName || normDbName.includes(normInputName) || normInputName.includes(normDbName);
      });

      if (found) {
        isNewArtist = false;
        matchedExistingArtistId = found.id;
        matchedExistingArtistName = found.name;
      }

      // 4. Status determination
      let status: 'ready' | 'warning' | 'error' = 'ready';
      let statusMessage = 'พร้อมนำเข้าสมบูรณ์';

      if (!matchedArtworkFile) {
        status = 'error';
        statusMessage = `❌ ไม่พบรูปผลงาน (ค้นหา: ${displayIdStr}.jpg หรือ p${displayIdStr}.jpg)`;
      } else if (!matchedArtistFile && isNewArtist) {
        status = 'warning';
        statusMessage = `ℹ️ ไม่มีรูปศิลปิน (จะสร้างศิลปินโดยใช้ Avatar เริ่มต้น)`;
      } else if (!isNewArtist) {
        statusMessage = `✓ พบศิลปินเดิมในฐานข้อมูล: ${matchedExistingArtistName} (จะแอดรูปผลงานเพิ่มเข้าศิลปินนี้)`;
      }

      results.push({
        id: `import-row-${idx}`,
        rowIndex: rowNum,
        rowIdStr: displayIdStr,
        selected: status !== 'error',
        artistName,
        artistCountry,
        artistEmail,
        artistBio,
        matchedExistingArtistId,
        matchedExistingArtistName,
        isNewArtist,
        artistFile: matchedArtistFile,
        artistPreviewUrl: matchedArtistFile ? URL.createObjectURL(matchedArtistFile) : undefined,
        artistFileName: matchedArtistFile?.name,
        artworkTitle,
        yearCreated,
        medium,
        dimensions,
        price,
        concept,
        artworkFile: matchedArtworkFile,
        artworkPreviewUrl: matchedArtworkFile ? URL.createObjectURL(matchedArtworkFile) : undefined,
        artworkFileName: matchedArtworkFile?.name,
        status,
        statusMessage,
      });
    });

    setMatchedItems(results);
  };

  const toggleRowSelected = (id: string) => {
    setMatchedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const selectAll = (selected: boolean) => {
    setMatchedItems((prev) =>
      prev.map((item) => (item.status === 'error' ? item : { ...item, selected }))
    );
  };

  const uploadImageToServer = async (file: File, folder: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('fileName', file.name.split('.')[0]);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Upload failed for file: ${file.name}`);
    }

    const data = await res.json();
    return data.url;
  };

  const runImportPipeline = async () => {
    const selectedRows = matchedItems.filter((m) => m.selected);
    if (selectedRows.length === 0) {
      alert('กรุณาเลือกอย่างน้อย 1 รายการเพื่อนำเข้า');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportCompleted(false);
    setImportLogs([]);

    const addLog = (type: 'info' | 'success' | 'warn' | 'error', message: string) => {
      setImportLogs((prev) => [...prev, { type, message }]);
    };

    addLog('info', `🚀 เริ่มต้นกระบวนการนำเข้าข้อมูล (${selectedRows.length} รายการ)...`);

    let successCount = 0;
    let failedCount = 0;
    let newArtistsCount = 0;

    const payloadItems: any[] = [];

    for (let i = 0; i < selectedRows.length; i++) {
      const item = selectedRows[i];
      const stepPercent = Math.round(((i + 0.2) / selectedRows.length) * 100);
      setImportProgress(stepPercent);
      setCurrentImportStep(`กำลังประมวลผลแถว ${i + 1}/${selectedRows.length}: ${item.artworkTitle}`);

      addLog('info', `[แถว ${item.rowIndex}] รหัส #${item.rowIdStr} - ศิลปิน: "${item.artistName}" | ผลงาน: "${item.artworkTitle}"`);

      try {
        let artistAvatarUrl: string | undefined;
        let artworkImageUrl = '';

        if (item.artistFile) {
          addLog('info', `  📤 กำลังอัปโหลดรูปศิลปิน: ${item.artistFile.name}...`);
          artistAvatarUrl = await uploadImageToServer(item.artistFile, '/artvara-artists');
          addLog('success', `  ✓ อัปโหลดรูปศิลปินสำเร็จ`);
        }

        if (item.artworkFile) {
          addLog('info', `  📤 กำลังอัปโหลดรูปผลงาน: ${item.artworkFile.name}...`);
          artworkImageUrl = await uploadImageToServer(item.artworkFile, '/artvara-artworks');
          addLog('success', `  ✓ อัปโหลดรูปผลงานสำเร็จ`);
        } else {
          throw new Error('ไม่พบไฟล์ภาพผลงาน');
        }

        if (item.isNewArtist) {
          newArtistsCount++;
        }

        payloadItems.push({
          title: item.artworkTitle,
          artistName: item.artistName,
          artistCountry: item.artistCountry,
          artistEmail: item.artistEmail,
          artistBio: item.artistBio,
          artistAvatarUrl: artistAvatarUrl,
          medium: item.medium,
          dimensions: item.dimensions,
          yearCreated: item.yearCreated,
          concept: item.concept,
          price: item.price,
          imageUrl: artworkImageUrl,
        });

        successCount++;
      } catch (err: any) {
        failedCount++;
        addLog('error', `  ❌ เกิดข้อผิดพลาดในแถวที่ ${item.rowIndex}: ${err.message || String(err)}`);
      }
    }

    if (payloadItems.length > 0) {
      setCurrentImportStep('กำลังบันทึกข้อมูลเข้าสู่ฐานข้อมูล D1...');
      addLog('info', `💾 กำลังบันทึกข้อมูลผลงาน ${payloadItems.length} ชิ้น และผูกศิลปินเข้าฐานข้อมูล...`);

      try {
        const res = await fetch('/api/admin/artworks/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: payloadItems,
            exhibitionId: targetExhibitionId || undefined,
          }),
        });

        if (res.ok) {
          const resultData = await res.json();
          addLog('success', `🎉 นำเข้าข้อมูลลงฐานข้อมูลสำเร็จทั้งหมด ${resultData.count || payloadItems.length} รายการ!`);
          if (onSuccess) onSuccess();
        } else {
          const errData = await res.json();
          throw new Error(errData.error || 'Database batch insertion failed');
        }
      } catch (dbErr: any) {
        addLog('error', `❌ ข้อผิดพลาดในการบันทึกลงฐานข้อมูล: ${dbErr.message}`);
      }
    }

    setImportProgress(100);
    setIsImporting(false);
    setImportCompleted(true);
    setCurrentImportStep('เสร็จสิ้นกระบวนการนำเข้า');
    setImportSummary({
      total: selectedRows.length,
      success: successCount,
      failed: failedCount,
      newArtists: newArtistsCount,
    });
  };

  const resetAll = () => {
    setExcelFile(null);
    setPastedExcelText('');
    setArtistFiles([]);
    setArtworkFiles([]);
    setMatchedItems([]);
    setImportCompleted(false);
    setImportLogs([]);
    if (excelInputRef.current) excelInputRef.current.value = '';
    if (artistFolderInputRef.current) artistFolderInputRef.current.value = '';
    if (artworkFolderInputRef.current) artworkFolderInputRef.current.value = '';
  };

  const downloadReportCsv = () => {
    const csvRows = [
      ['Row ID', 'Artist Name', 'Artist Status', 'Artist Image File', 'Artwork Title', 'Artwork Image File', 'Medium', 'Dimensions', 'Year', 'Status'],
      ...matchedItems.map((m) => [
        m.rowIdStr,
        m.artistName,
        m.isNewArtist ? 'New Artist' : `Existing (${m.matchedExistingArtistId})`,
        m.artistFileName || 'None',
        m.artworkTitle,
        m.artworkFileName || 'Missing',
        m.medium,
        m.dimensions,
        m.yearCreated,
        m.statusMessage,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `artvara_import_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validRowsCount = matchedItems.filter((m) => m.status !== 'error').length;
  const selectedCount = matchedItems.filter((m) => m.selected).length;

  return (
    <div className={`max-w-7xl mx-auto space-y-6 ${isModalMode ? 'p-1' : 'pb-16'}`}>
      {/* Top Header */}
      {!isModalMode && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#33302C] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/artworks"
                className="p-2 rounded-lg bg-[#24221F] text-neutral-400 hover:text-white border border-[#3A3732] transition-colors"
                title="กลับหน้าคลังผลงาน"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight flex items-center gap-3">
                <span>ระบบนำเข้าข้อมูลผ่าน Excel และโฟลเดอร์ภาพ</span>
                <span className="text-xs bg-[#C5A880]/20 text-[#8C6D3F] px-2.5 py-1 rounded-full font-sans font-bold border border-[#C5A880]/30">
                  Batch Drag & Drop
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 pl-11">
              ช่วงที่ 1 โหลดรูปศิลปิน • ช่วงที่ 2 โหลดรูปผลงาน • ช่วงที่ 3 วางข้อมูลตาราง Excel เพื่อจับคู่และแอดข้อมูลเข้าสู่ระบบ
            </p>
          </div>

          {/* Target Exhibition Picker */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#D5CEC4] shadow-sm">
            <Layers className="w-4 h-4 text-[#8C6D3F]" />
            <div className="text-left">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                ผูกเข้ากับนิทรรศการ:
              </label>
              <select
                value={targetExhibitionId}
                onChange={(e) => setTargetExhibitionId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
              >
                <option value="">-- ไม่ระบุนิทรรศการ (เข้าคลังผลงานหลัก) --</option>
              {exhibitionsList.map((exh) => (
                <option key={exh.id} value={exh.id}>
                  {exh.title} ({exh.status})
                </option>
              ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3 Processing Stages (ช่วงที่ 1 + ช่วงที่ 2 + ช่วงที่ 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ช่วงที่ 1: โหลดรูปศิลปิน */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsArtistDragOver(true);
          }}
          onDragLeave={() => setIsArtistDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsArtistDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const files = Array.from(e.dataTransfer.files).filter((f) =>
                /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)
              );
              if (files.length > 0) setArtistFiles(files);
            }
          }}
          className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-between text-center min-h-[250px] relative ${
            isArtistDragOver
              ? 'bg-blue-100/80 border-blue-600 scale-[1.02] shadow-md'
              : artistFiles.length > 0
              ? 'bg-blue-50/60 border-blue-500/70 shadow-sm'
              : 'bg-white border-[#D5CEC4] hover:border-blue-500 hover:bg-blue-50/20'
          }`}
        >
          {/* File Picker: Shows all image files in Explorer */}
          <input
            ref={artistFileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/*"
            className="hidden"
            onChange={handleArtistFolderChange}
          />
          {/* Folder Picker: Allows selecting entire folder */}
          <input
            ref={artistFolderInputRef}
            type="file"
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden"
            onChange={handleArtistFolderChange}
          />

          <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 shadow-sm mt-1">
            <User className="w-6 h-6" />
          </div>

          <div className="space-y-1 my-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
              ช่วงที่ 1: โหลดรูปศิลปิน
            </span>
            <h3 className="font-bold text-sm text-neutral-800">
              {artistFiles.length > 0 ? `พบรูปศิลปิน ${artistFiles.length} ไฟล์` : 'ลากวางไฟล์ หรือคลิกเลือกรูป'}
            </h3>
            <p className="text-xs text-neutral-500">
              ชื่อไฟล์ <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-[11px]">001.jpg, 002.jpg...</code>
            </p>
          </div>

          {/* Action Buttons for Selection */}
          <div className="w-full space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => artistFileInputRef.current?.click()}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>เลือกหลายไฟล์ภาพ (Ctrl+A)</span>
            </button>
            <button
              type="button"
              onClick={() => artistFolderInputRef.current?.click()}
              className="w-full py-1.5 px-3 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>หรือเลือกทั้งโฟลเดอร์</span>
            </button>
          </div>
        </div>

        {/* ช่วงที่ 2: โหลดรูปผลงาน */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsArtworkDragOver(true);
          }}
          onDragLeave={() => setIsArtworkDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsArtworkDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const files = Array.from(e.dataTransfer.files).filter((f) =>
                /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)
              );
              if (files.length > 0) setArtworkFiles(files);
            }
          }}
          className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-between text-center min-h-[250px] relative ${
            isArtworkDragOver
              ? 'bg-amber-100/80 border-amber-600 scale-[1.02] shadow-md'
              : artworkFiles.length > 0
              ? 'bg-amber-50/60 border-amber-500/70 shadow-sm'
              : 'bg-white border-[#D5CEC4] hover:border-amber-500 hover:bg-amber-50/20'
          }`}
        >
          {/* File Picker: Shows all image files in Explorer */}
          <input
            ref={artworkFileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/*"
            className="hidden"
            onChange={handleArtworkFolderChange}
          />
          {/* Folder Picker: Allows selecting entire folder */}
          <input
            ref={artworkFolderInputRef}
            type="file"
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden"
            onChange={handleArtworkFolderChange}
          />

          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-sm mt-1">
            <Palette className="w-6 h-6" />
          </div>

          <div className="space-y-1 my-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              ช่วงที่ 2: โหลดรูปผลงาน
            </span>
            <h3 className="font-bold text-sm text-neutral-800">
              {artworkFiles.length > 0 ? `พบรูปผลงาน ${artworkFiles.length} ไฟล์` : 'ลากวางไฟล์ หรือคลิกเลือกรูป'}
            </h3>
            <p className="text-xs text-neutral-500">
              ชื่อไฟล์ <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-[11px]">001.jpg, 002.jpg...</code>
            </p>
          </div>

          {/* Action Buttons for Selection */}
          <div className="w-full space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => artworkFileInputRef.current?.click()}
              className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>เลือกหลายไฟล์ภาพ (Ctrl+A)</span>
            </button>
            <button
              type="button"
              onClick={() => artworkFolderInputRef.current?.click()}
              className="w-full py-1.5 px-3 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>หรือเลือกทั้งโฟลเดอร์</span>
            </button>
          </div>
        </div>

        {/* ช่วงที่ 3: ช่องสำหรับวางข้อมูลจากตาราง Excel */}
        <div className="p-5 rounded-2xl bg-white border border-[#D5CEC4] shadow-sm flex flex-col justify-between min-h-[240px]">
          <div>
            <div className="flex items-center justify-between border-b border-[#E8E3DC] pb-2.5 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                ช่วงที่ 3: ตาราง Excel
              </span>

              {/* Mode Toggle: File Upload vs Copy-Paste */}
              <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-300 text-[11px] font-bold">
                <button
                  onClick={() => setExcelInputMode('file')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    excelInputMode === 'file' ? 'bg-white text-emerald-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <FileUp className="w-3 h-3" />
                  <span>ไฟล์ .xlsx</span>
                </button>
                <button
                  onClick={() => setExcelInputMode('paste')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    excelInputMode === 'paste' ? 'bg-white text-emerald-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>วางข้อความ</span>
                </button>
              </div>
            </div>

            {excelInputMode === 'file' ? (
              <div
                onClick={() => excelInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsExcelDragOver(true);
                }}
                onDragLeave={() => setIsExcelDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsExcelDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setExcelFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`p-4 border-2 border-dashed rounded-xl text-center cursor-pointer space-y-1.5 transition-all ${
                  isExcelDragOver
                    ? 'border-emerald-600 bg-emerald-100/70 scale-[1.02]'
                    : 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/40'
                }`}
              >
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleExcelChange}
                />
                <FileSpreadsheet className="w-8 h-8 text-emerald-700 mx-auto" />
                <p className="text-xs font-bold text-neutral-800">
                  {excelFile ? excelFile.name : 'คลิกหรือลากวางไฟล์ Excel / CSV'}
                </p>
                <p className="text-[10px] text-neutral-500">
                  {excelFile ? `ขนาด ${(excelFile.size / 1024).toFixed(1)} KB` : 'คุมข้อมูลแถวที่ 1, 2, 3...'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  rows={4}
                  value={pastedExcelText}
                  onChange={(e) => setPastedExcelText(e.target.value)}
                  placeholder="กด Ctrl+V วางข้อมูลที่ Copy มาจากตาราง Excel ได้โดยตรงที่นี่..."
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-mono text-[11px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
                />
              </div>
            )}
          </div>

          <div className="pt-2 text-center">
            {matchedItems.length > 0 ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> อ่านพบ {matchedItems.length} แถวข้อมูล
              </span>
            ) : (
              <span className="text-[11px] text-neutral-400">
                รองรับคอลัมน์ ID, ชื่อศิลปิน, ชื่องาน, เทคนิค, ขนาด, ปี, ราคา
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Lightbox Zoom Modal */}
      {zoomImageUrl && (
        <div
          onClick={() => setZoomImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-neutral-900 border border-neutral-700 rounded-2xl overflow-hidden shadow-2xl p-2 text-center" onClick={(e) => e.stopPropagation()}>
            <img src={zoomImageUrl} alt="Zoom Preview" className="max-h-[70vh] w-auto mx-auto rounded-xl object-contain" />
            <div className="p-3 flex items-center justify-between">
              <span className="text-xs text-neutral-300 font-mono">{zoomImageTitle}</span>
              <button
                onClick={() => setZoomImageUrl(null)}
                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white rounded-lg"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Match Preview & Actions */}
      {matchedItems.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#D5CEC4] shadow-sm overflow-hidden space-y-6">
          {/* Action Bar & Stat Cards */}
          <div className="p-6 border-b border-[#E8E3DC] bg-[#FBF9F6] space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-lg font-bold text-neutral-900">
                    ตารางตรวจสอบความถูกต้องก่อนบันทึกเข้าฐานข้อมูล (Pre-Import Verification Matrix)
                  </h2>
                  <span className="text-xs bg-neutral-900 text-[#D4AF37] px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {matchedItems.length} แถว
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  ท่านสามารถตรวจทานรูปภาพ, รายละเอียดชิ้นงาน, และสถานะการตรวจศิลปินซ้ำได้ก่อนกดปุ่มยืนยัน
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => selectAll(true)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 transition-colors"
                >
                  เลือกทั้งหมด
                </button>
                <button
                  onClick={() => selectAll(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 transition-colors"
                >
                  ยกเลิกทั้งหมด
                </button>
                <button
                  onClick={resetAll}
                  className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> ล้างข้อมูล
                </button>

                <button
                  onClick={runImportPipeline}
                  disabled={isImporting || selectedCount === 0}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all ${
                    isImporting || selectedCount === 0
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-[#8B1B1B] hover:bg-[#721515] text-[#D4AF37] hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                      <span>กำลังนำเข้าข้อมูล... ({importProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>ตกลงนำเข้าฐานข้อมูล ({selectedCount} รายการ)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Stat Pill Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#EAE5DC] text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-[#E0D9CD] flex items-center justify-between">
                <span className="text-neutral-500">ผลงานพร้อมนำเข้า:</span>
                <span className="font-bold text-emerald-800 font-mono text-sm">{validRowsCount} / {matchedItems.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E0D9CD] flex items-center justify-between">
                <span className="text-neutral-500">ศิลปินเดิมในระบบ:</span>
                <span className="font-bold text-blue-800 font-mono text-sm">{matchedItems.filter(m => !m.isNewArtist).length} ท่าน</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E0D9CD] flex items-center justify-between">
                <span className="text-neutral-500">ศิลปินใหม่ที่จะสร้าง:</span>
                <span className="font-bold text-purple-800 font-mono text-sm">{matchedItems.filter(m => m.isNewArtist).length} ท่าน</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#E0D9CD] flex items-center justify-between">
                <span className="text-neutral-500">รายการที่มีข้อผิดพลาด:</span>
                <span className={`font-bold font-mono text-sm ${matchedItems.filter(m => m.status === 'error').length > 0 ? 'text-red-600' : 'text-neutral-400'}`}>
                  {matchedItems.filter(m => m.status === 'error').length} รายการ
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {isImporting && (
            <div className="px-6 space-y-2">
              <div className="flex justify-between text-xs font-bold text-neutral-700">
                <span>{currentImportStep}</span>
                <span>{importProgress}%</span>
              </div>
              <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                <div
                  className="h-full bg-gradient-to-r from-[#8B1B1B] to-[#D4AF37] transition-all duration-300 rounded-full"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Summary Box */}
          {importCompleted && (
            <div className="mx-6 p-6 rounded-xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl shadow">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-900">การนำเข้าข้อมูลเสร็จสมบูรณ์!</h4>
                  <p className="text-xs text-emerald-700">
                    นำเข้าสำเร็จ: {importSummary.success} รายการ | ข้อผิดพลาด: {importSummary.failed} รายการ | ศิลปินใหม่ที่สร้าง: {importSummary.newArtists} ท่าน
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={downloadReportCsv}
                  className="px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" /> ดาวน์โหลดรายงาน Audit Log (.CSV)
                </button>
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-800">
              <thead className="bg-[#F3EFE9] text-neutral-600 uppercase tracking-wider font-bold border-b border-[#D5CEC4]">
                <tr>
                  <th className="p-3.5 w-12 text-center">เลือก</th>
                  <th className="p-3.5 w-16 text-center">ID</th>
                  <th className="p-3.5 w-48">👤 รูปและชื่อศิลปิน (ช่วงที่ 1)</th>
                  <th className="p-3.5 w-56">🎨 รูปและชื่อผลงาน (ช่วงที่ 2)</th>
                  <th className="p-3.5">ข้อมูลจากตาราง (ช่วงที่ 3)</th>
                  <th className="p-3.5 w-60">ผลการตรวจฐานข้อมูล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DE]">
                {matchedItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      !item.selected
                        ? 'bg-neutral-50/70 opacity-60'
                        : item.status === 'error'
                        ? 'bg-red-50/40'
                        : 'hover:bg-[#FDFBF7]'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        disabled={item.status === 'error' || isImporting}
                        onChange={() => toggleRowSelected(item.id)}
                        className="w-4 h-4 rounded text-[#8B1B1B] focus:ring-[#8B1B1B] cursor-pointer"
                      />
                    </td>

                    {/* Prefix ID */}
                    <td className="p-3.5 text-center font-mono font-bold text-neutral-900 bg-neutral-100/50">
                      {item.rowIdStr}
                    </td>

                    {/* Artist Column */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => {
                            if (item.artistPreviewUrl) {
                              setZoomImageUrl(item.artistPreviewUrl);
                              setZoomImageTitle(`รูปศิลปิน: ${item.artistName}`);
                            }
                          }}
                          className={`w-12 h-12 rounded-xl bg-neutral-200 border border-neutral-300 overflow-hidden shrink-0 relative flex items-center justify-center shadow-inner ${item.artistPreviewUrl ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''}`}
                          title={item.artistPreviewUrl ? 'คลิกเพื่อดูรูปขยาย' : undefined}
                        >
                          {item.artistPreviewUrl ? (
                            <img
                              src={item.artistPreviewUrl}
                              alt={item.artistName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-neutral-900 leading-tight">{item.artistName}</p>
                          <div className="flex items-center gap-1.5">
                            {item.isNewArtist ? (
                              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                                ✨ สร้างศิลปินใหม่
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                                ✓ ศิลปินเดิม
                              </span>
                            )}
                            <span className="text-[10px] text-neutral-500">{item.artistCountry}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-mono">
                            {item.artistFileName || 'ไม่มีรูปศิลปิน'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Artwork Column */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => {
                            if (item.artworkPreviewUrl) {
                              setZoomImageUrl(item.artworkPreviewUrl);
                              setZoomImageTitle(`รูปผลงาน: ${item.artworkTitle} (${item.artistName})`);
                            }
                          }}
                          className={`w-14 h-14 rounded-xl bg-neutral-200 border border-neutral-300 overflow-hidden shrink-0 relative flex items-center justify-center shadow-inner ${item.artworkPreviewUrl ? 'cursor-pointer hover:ring-2 hover:ring-amber-500' : ''}`}
                          title={item.artworkPreviewUrl ? 'คลิกเพื่อดูรูปขยาย' : undefined}
                        >
                          {item.artworkPreviewUrl ? (
                            <img
                              src={item.artworkPreviewUrl}
                              alt={item.artworkTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Palette className="w-6 h-6 text-neutral-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-neutral-900 line-clamp-1">{item.artworkTitle}</p>
                          <p className="text-[10px] text-neutral-400 font-mono">
                            {item.artworkFileName ? (
                              <span className="text-emerald-700 font-semibold">{item.artworkFileName}</span>
                            ) : (
                              <span className="text-red-600 font-bold">❌ ไม่พบรูปผลงาน</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Details Column */}
                    <td className="p-3.5 space-y-1 text-neutral-600">
                      <p>
                        <span className="text-neutral-400">เทคนิค:</span> <span className="font-medium text-neutral-800">{item.medium}</span>
                      </p>
                      <p>
                        <span className="text-neutral-400">ขนาด:</span> <span className="font-medium text-neutral-800">{item.dimensions}</span>
                        {item.yearCreated && item.yearCreated !== 'cm.' && item.yearCreated !== '2026' && (
                          <> | <span className="text-neutral-400">ปี:</span> {item.yearCreated}</>
                        )}
                      </p>
                      {item.concept && (
                        <p className="text-[11px] text-neutral-500 line-clamp-1 italic" title={item.concept}>
                          &quot;{item.concept}&quot;
                        </p>
                      )}
                      {item.price && !isNaN(parseFloat(item.price)) && parseFloat(item.price) > 0 && (
                        <p className="text-emerald-700 font-bold">
                          ฿{parseFloat(item.price).toLocaleString()}
                        </p>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="p-3.5">
                      {item.status === 'ready' && (
                        <div className="flex items-start gap-1.5 text-emerald-700 font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{item.statusMessage}</span>
                        </div>
                      )}
                      {item.status === 'warning' && (
                        <div className="flex items-start gap-1.5 text-amber-700 text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{item.statusMessage}</span>
                        </div>
                      )}
                      {item.status === 'error' && (
                        <div className="flex items-start gap-1.5 text-red-700 text-xs font-semibold">
                          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{item.statusMessage}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-10 rounded-2xl bg-white border border-dashed border-[#D5CEC4] text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E0D9CD] flex items-center justify-center text-[#8C6D3F] mx-auto shadow-sm">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-neutral-800">
              ตารางตรวจสอบจะแสดงขึ้นที่นี่อัตโนมัติ
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
              เมื่อท่านทำการเลือกรูปศิลปิน, รูปผลงาน และข้อมูล Excel ด้านบนเรียบร้อยแล้ว ระบบจะจับคู่และสร้างตารางให้ท่านตรวจทานความถูกต้อง รูปภาพ และสถานะศิลปินซ้ำทั้งหมดก่อนกดยืนยัน
            </p>
          </div>
        </div>
      )}

      {/* Live Import Logs Console */}
      {importLogs.length > 0 && (
        <div className="bg-[#1A1918] rounded-2xl p-6 border border-[#33302C] text-xs font-mono text-neutral-300 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#33302C] pb-3">
            <h4 className="font-bold text-[#D4AF37] flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
              <span>บันทึกการทำงานของการนำเข้า (Import Execution Audit Trail)</span>
            </h4>
            <span className="text-[10px] text-neutral-500">{importLogs.length} บรรทัด</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
            {importLogs.map((log, idx) => {
              let color = 'text-neutral-300';
              if (log.type === 'success') color = 'text-emerald-400 font-semibold';
              if (log.type === 'warn') color = 'text-amber-400';
              if (log.type === 'error') color = 'text-red-400 font-bold';
              return (
                <div key={idx} className={color}>
                  {log.message}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
