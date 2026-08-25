'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle, X, Link as LinkIcon, Loader2, RefreshCw } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface ImageUploadDropzoneProps {
  value: string;
  onChange: (url: string) => void;
  titleHint?: string;
  label?: string;
  helperText?: string;
  folder?: string;
  shape?: 'rounded' | 'circle';
  required?: boolean;
}

export function ImageUploadDropzone({
  value,
  onChange,
  titleHint,
  label = 'รูปภาพ (Image)',
  helperText,
  folder = '/artvara-artworks',
  shape = 'rounded',
  required = false,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [inputUrl, setInputUrl] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setInputUrl(value || '');
  }, [value]);

  const handleUploadFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WebP, GIF)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('ไฟล์มีขนาดเกิน 25MB');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (titleHint) {
        formData.append('fileName', titleHint);
      }
      if (folder) {
        formData.append('folder', folder);
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to upload image');
      }

      onChange(data.url);
      setInputUrl(data.url);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A]">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
        
        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#EBE5DA] p-0.5 rounded-lg text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-0.5 rounded-md transition-all ${
              mode === 'upload' ? 'bg-white text-[#1A1918] shadow-sm' : 'text-[#7A7367] hover:text-[#1A1918]'
            }`}
          >
            ☁️ อัปโหลด / Drag & Drop
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-0.5 rounded-md transition-all ${
              mode === 'url' ? 'bg-white text-[#1A1918] shadow-sm' : 'text-[#7A7367] hover:text-[#1A1918]'
            }`}
          >
            🔗 วาง URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="space-y-3">
          {/* Dropzone Container */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-[#8C6D3F] bg-[#FAF3E8] scale-[1.01]'
                : value
                ? 'border-[#C5A880] bg-[#FAF8F5] hover:border-[#8C6D3F]'
                : 'border-[#D5CFC3] bg-white hover:border-[#8C6D3F] hover:bg-[#FAF8F5]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadFile(file);
              }}
            />

            {isUploading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-[#8C6D3F] animate-spin" />
                <p className="text-xs font-bold text-[#1A1918]">กำลังอัปโหลดรูปภาพไปยัง ImageKit.io CDN...</p>
                <p className="text-[10px] text-[#7A7468]">กำลังประมวลผลไฟล์ภาพความละเอียดสูง</p>
              </div>
            ) : value ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 text-left">
                <div
                  className={`relative ${
                    shape === 'circle'
                      ? 'w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#C5A880]'
                      : 'w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-[#D5CFC3]'
                  } overflow-hidden bg-[#1A1918] shrink-0 shadow-md`}
                >
                  <img
                    src={getOptimizedImageUrl(value, { width: 240, quality: 80 })}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>อัปโหลดรูปภาพสำเร็จ (พร้อมใช้งาน)</span>
                  </div>
                  <p className="text-[11px] text-[#8C8477] font-mono truncate">{value}</p>
                  <p className="text-[10px] text-[#8C6D3F] font-semibold flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    <span>คลิกหรือลากไฟล์ใหม่มาวางเพื่อเปลี่ยนภาพ</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 flex flex-col items-center justify-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-[#FAF3E8] border border-[#E5D7C2] flex items-center justify-center text-[#8C6D3F] shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1A1918]">
                    ลากไฟล์รูปภาพมาวางที่นี่ หรือ <span className="text-[#8C6D3F] underline">คลิกเพื่อเลือกไฟล์</span>
                  </p>
                  <p className="text-[11px] text-[#7A7468] mt-0.5">
                    {helperText || 'รองรับไฟล์ JPG, PNG, WebP (ไฟล์จะถูกอัปโหลดขึ้น ImageKit.io CDN อัตโนมัติ)'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        /* Direct URL Input Mode */
        <div className="space-y-2">
          <input
            type="url"
            required={required}
            value={value}
            onChange={(e) => {
              setInputUrl(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="https://ik.imagekit.io/... หรือ https://images.unsplash.com/..."
            className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg font-mono text-xs text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
          />
          {value && (
            <div className="flex items-center gap-3 p-2 bg-[#FAF8F5] rounded-lg border border-[#EAE5DA]">
              <div
                className={`relative ${
                  shape === 'circle' ? 'w-10 h-10 rounded-full border border-[#C5A880]' : 'w-10 h-10 rounded border border-[#D5CFC3]'
                } overflow-hidden bg-[#1A1918] shrink-0`}
              >
                <img
                  src={getOptimizedImageUrl(value, { width: 160, quality: 75 })}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[11px] text-[#6E685C] truncate font-mono flex-1">{value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
