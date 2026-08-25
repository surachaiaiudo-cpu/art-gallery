'use client';

import React from 'react';
import { Edit3, X, Save, CheckCircle2 } from 'lucide-react';

interface FooterEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverFooter: string;
  plateFooter: string;
  footerGraphicType: 'wave_gold' | 'wave_mono' | 'line_gold' | 'custom_image' | 'none';
  customFooterImageUrl: string;
  saving: boolean;
  savedSuccess: boolean;
  onChangeCoverFooter: (val: string) => void;
  onChangePlateFooter: (val: string) => void;
  onChangeFooterGraphicType: (val: 'wave_gold' | 'wave_mono' | 'line_gold' | 'custom_image' | 'none') => void;
  onChangeCustomFooterImageUrl: (val: string) => void;
  onSave: (e: React.FormEvent) => void;
}

export function FooterEditorModal({
  isOpen,
  onClose,
  coverFooter,
  plateFooter,
  footerGraphicType,
  customFooterImageUrl,
  saving,
  savedSuccess,
  onChangeCoverFooter,
  onChangePlateFooter,
  onChangeFooterGraphicType,
  onChangeCustomFooterImageUrl,
  onSave,
}: FooterEditorModalProps) {
  if (!isOpen) return null;

  const handleFooterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onChangeCustomFooterImageUrl(event.target.result as string);
        onChangeFooterGraphicType('custom_image');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[#1E1D1B]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b border-[#E3DED4] pb-3.5 mb-5 flex items-center gap-2">
          <div className="p-2 bg-[#8C6D3F]/10 rounded-lg text-[#8C6D3F]">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1A1918]">
              แก้ไขข้อความ Footer ของสูจิบัตร
            </h3>
            <p className="text-[11px] text-[#7A7468]">
              ปรับแต่งข้อความท้ายหน้าปก และข้อความท้ายหน้ารูปผลงานแต่ละหน้า
            </p>
          </div>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4A443A] mb-1">
              1. ข้อความ Footer ท้ายหน้าปกสูจิบัตร (Cover Footer)
            </label>
            <input
              type="text"
              required
              value={coverFooter}
              onChange={(e) => onChangeCoverFooter(e.target.value)}
              placeholder="เช่น International Art Festival and Art Exhibition in Thailand • 18th Poh-Chang Art Festival"
              className="w-full px-3.5 py-2.5 bg-white border border-[#D5CEC0] rounded-xl text-xs text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
            />
            <span className="text-[10px] text-[#8C8477] mt-1 block">
              จะแสดงที่แถบท้ายสุดของหน้าปกสูจิบัตร
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A443A] mb-1">
              2. ข้อความ Footer ท้ายหน้ารูปผลงานแต่ละหน้า (Artwork Page Footer - ไม่บังคับ)
            </label>
            <input
              type="text"
              value={plateFooter}
              onChange={(e) => onChangePlateFooter(e.target.value)}
              placeholder="เช่น 18th Poh-Chang Art Festival 2026 หรือเว้นว่างไว้"
              className="w-full px-3.5 py-2.5 bg-white border border-[#D5CEC0] rounded-xl text-xs text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
            />
            <span className="text-[10px] text-[#8C8477] mt-1 block">
              จะแสดงที่แถบท้ายสุดของหน้ารูปผลงานแต่ละหน้า (หากไม่ต้องการให้แสดงข้อความสามารถเว้นว่างไว้ได้)
            </span>
          </div>

          {/* 3. Footer Graphic / Image Customizer */}
          <div className="pt-2 border-t border-[#E8E2D6] space-y-2.5">
            <label className="block text-xs font-bold text-[#4A443A]">
              3. ภาพ / กราฟิกลายเส้น Footer ด้านล่างของสูจิบัตร
            </label>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => onChangeFooterGraphicType('wave_gold')}
                className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all cursor-pointer ${
                  footerGraphicType === 'wave_gold'
                    ? 'border-[#8C6D3F] bg-[#FAF6EE] text-[#8C6D3F] shadow-sm ring-1 ring-[#8C6D3F]'
                    : 'border-[#DDD6C8] bg-white text-[#555] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="block text-sm mb-0.5">🌊</span>
                <span>คลื่นทอง-เงิน</span>
                <span className="block text-[9px] text-[#888] font-normal">ค่าเริ่มต้น</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeFooterGraphicType('wave_mono')}
                className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all cursor-pointer ${
                  footerGraphicType === 'wave_mono'
                    ? 'border-[#8C6D3F] bg-[#FAF6EE] text-[#8C6D3F] shadow-sm ring-1 ring-[#8C6D3F]'
                    : 'border-[#DDD6C8] bg-white text-[#555] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="block text-sm mb-0.5">🖤</span>
                <span>คลื่นโมโนโครม</span>
                <span className="block text-[9px] text-[#888] font-normal">เทา-ดำ</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeFooterGraphicType('line_gold')}
                className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all cursor-pointer ${
                  footerGraphicType === 'line_gold'
                    ? 'border-[#8C6D3F] bg-[#FAF6EE] text-[#8C6D3F] shadow-sm ring-1 ring-[#8C6D3F]'
                    : 'border-[#DDD6C8] bg-white text-[#555] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="block text-sm mb-0.5">✨</span>
                <span>เส้นทองมินิมอล</span>
                <span className="block text-[9px] text-[#888] font-normal">เรียบหรู</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeFooterGraphicType('none')}
                className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all cursor-pointer ${
                  footerGraphicType === 'none'
                    ? 'border-[#8C6D3F] bg-[#FAF6EE] text-[#8C6D3F] shadow-sm ring-1 ring-[#8C6D3F]'
                    : 'border-[#DDD6C8] bg-white text-[#555] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="block text-sm mb-0.5">🚫</span>
                <span>ไม่มีลวดลาย</span>
                <span className="block text-[9px] text-[#888] font-normal">พื้นขาวล้วน</span>
              </button>
            </div>

            {/* Custom Image Upload Option */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#4A443A]">
                  หรือ อัปโหลดภาพ / แบนเนอร์ Footer ของท่านเอง:
                </span>
                {customFooterImageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      onChangeCustomFooterImageUrl('');
                      onChangeFooterGraphicType('wave_gold');
                    }}
                    className="text-[10px] text-red-600 hover:underline cursor-pointer"
                  >
                    ลบภาพ / ใช้ลายมาตรฐาน
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-dashed border-[#C5A880] hover:border-[#8C6D3F] rounded-xl text-xs font-medium text-[#8C6D3F] cursor-pointer hover:bg-[#FAF6EE] transition-all">
                  <span>📁 เลือกไฟล์ภาพ Footer (PNG/JPG/SVG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFooterImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {customFooterImageUrl && (
                <div className="mt-2 p-2 bg-white rounded-lg border border-[#E0D8C8] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={customFooterImageUrl}
                      alt="Custom Footer Preview"
                      className="w-16 h-6 object-contain rounded bg-neutral-100 p-0.5 border border-neutral-200"
                    />
                    <span className="text-[10px] text-green-700 font-semibold">
                      ✓ อัปโหลดสำเร็จ (กำลังใช้งาน)
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    ขนาดแนะนำ: 2000x200px
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E3DED4] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#666] hover:text-[#1A1918] hover:bg-[#EAE5DA] rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#8C6D3F] hover:bg-[#735831] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-300" />
                  <span>บันทึกสำเร็จ!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
