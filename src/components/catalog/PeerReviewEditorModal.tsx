'use client';

import React from 'react';
import { PeerReviewer } from '@/types/exhibition';
import { X, Save, CheckCircle2, GraduationCap, Plus, Trash2, Camera } from 'lucide-react';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';

interface PeerReviewEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerReviewersList: PeerReviewer[];
  savingReviewers: boolean;
  savedReviewersSuccess: boolean;
  onAddReviewer: () => void;
  onUpdateReviewer: (index: number, field: keyof PeerReviewer, value: string) => void;
  onRemoveReviewer: (index: number) => void;
  onSave: (e: React.FormEvent) => void;
}

export function PeerReviewEditorModal({
  isOpen,
  onClose,
  peerReviewersList,
  savingReviewers,
  savedReviewersSuccess,
  onAddReviewer,
  onUpdateReviewer,
  onRemoveReviewer,
  onSave,
}: PeerReviewEditorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[#1E1D1B] my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b border-[#E3DED4] pb-3.5 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#8C6D3F]/10 rounded-lg text-[#8C6D3F]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A1918]">
                จัดการรายนามคณะกรรมการผู้ทรงคุณวุฒิ (Peer Reviewers)
              </h3>
              <p className="text-[11px] text-[#7A7468]">
                เพิ่ม/แก้ไข รายชื่อผู้ทรงคุณวุฒิประเมินผลงานสำหรับสูจิบัตรวิชาการ (สูงสุด 6 ท่าน)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddReviewer}
            disabled={peerReviewersList.length >= 6}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#8C6D3F] hover:bg-[#735831] disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มกรรมการ ({peerReviewersList.length}/6)</span>
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {peerReviewersList.length === 0 ? (
            <div className="text-center py-8 bg-white border border-dashed border-[#D5CEC0] rounded-xl space-y-3">
              <GraduationCap className="w-8 h-8 text-[#A59E91] mx-auto" />
              <p className="text-xs text-[#7A7468]">
                ยังไม่มีรายนามผู้ทรงคุณวุฒิในสูจิบัตรนี้ (หน้าสูจิบัตรจะข้ามหน้าคณะกรรมการไปที่รูปผลงานทันที)
              </p>
              <button
                type="button"
                onClick={onAddReviewer}
                className="px-4 py-2 bg-[#8C6D3F] text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มผู้ทรงคุณวุฒิท่านแรก</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {peerReviewersList.map((reviewer, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white border border-[#E3DED4] rounded-xl space-y-2.5 relative group shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2">
                    <span className="text-xs font-bold text-[#8C6D3F] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#8C6D3F] text-white flex items-center justify-center text-[10px] font-mono">
                        {idx + 1}
                      </span>
                      ผู้ทรงคุณวุฒิท่านที่ {idx + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => onRemoveReviewer(idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
                      title="ลบกรรมการท่านนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#555] mb-1">
                        บทบาท / ตำแหน่งในคณะกรรมการ *
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewer.role || ''}
                        onChange={(e) => onUpdateReviewer(idx, 'role', e.target.value)}
                        placeholder="เช่น ประธานกรรมการ / กรรมการผู้ทรงคุณวุฒิ"
                        className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD7CC] rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#555] mb-1">
                        ตำแหน่งทางวิชาการ / คำนำหน้า
                      </label>
                      <input
                        type="text"
                        value={reviewer.academicTitle || ''}
                        onChange={(e) => onUpdateReviewer(idx, 'academicTitle', e.target.value)}
                        placeholder="เช่น ศ.ดร. / รศ. / ผศ. / Dr."
                        className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD7CC] rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#555] mb-1">
                        ชื่อ-นามสกุล *
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewer.name || ''}
                        onChange={(e) => onUpdateReviewer(idx, 'name', e.target.value)}
                        placeholder="เช่น สมชาย ใจดี"
                        className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD7CC] rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#555] mb-1">
                        การทำงาน / ตำแหน่งงานปัจจุบัน
                      </label>
                      <input
                        type="text"
                        value={reviewer.currentPosition || ''}
                        onChange={(e) => onUpdateReviewer(idx, 'currentPosition', e.target.value)}
                        placeholder="เช่น คณบดีคณะศิลปกรรมศาสตร์ / ศิลปินแห่งชาติ"
                        className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD7CC] rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#555] mb-1">
                        สถาบัน / หน่วยงานสังกัด
                      </label>
                      <input
                        type="text"
                        value={reviewer.institution || ''}
                        onChange={(e) => onUpdateReviewer(idx, 'institution', e.target.value)}
                        placeholder="เช่น มหาวิทยาลัยเทคโนโลยีราชมงคลรัตนโกสินทร์"
                        className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD7CC] rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#555] mb-1">
                        ประเทศ / สัญชาติ (Country)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <div className="relative w-6 h-4 rounded-[1px] overflow-hidden border border-[#D0D0D0] shrink-0 bg-[#F5F5F5]">
                          <img
                            src={getFlagImageUrl(reviewer.country)}
                            alt={reviewer.country || 'Flag'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <input
                          type="text"
                          value={reviewer.country || ''}
                          onChange={(e) => onUpdateReviewer(idx, 'country', e.target.value)}
                          placeholder="เช่น Thailand / Japan / Italy"
                          className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD7CC] rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Avatar URL or Upload */}
                  <div className="pt-1 flex items-center gap-2">
                    <label className="text-[10px] font-bold text-[#555] shrink-0">
                      รูปถ่ายกรรมการ:
                    </label>
                    <input
                      type="text"
                      value={reviewer.avatarUrl || ''}
                      onChange={(e) => onUpdateReviewer(idx, 'avatarUrl', e.target.value)}
                      placeholder="ใส่ URL รูปภาพ หรือกดปุ่มอัปโหลดรูป..."
                      className="flex-1 px-2.5 py-1 bg-[#FAF8F5] border border-[#DDD7CC] rounded-lg text-[11px]"
                    />
                    <label className="px-2.5 py-1 bg-white border border-[#C5A880] text-[#8C6D3F] hover:bg-[#FAF6EE] rounded-lg text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 shrink-0">
                      <Camera className="w-3 h-3" />
                      <span>อัปโหลดรูป</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              onUpdateReviewer(idx, 'avatarUrl', ev.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-[#E3DED4] flex items-center justify-between">
            <button
              type="button"
              onClick={onAddReviewer}
              disabled={peerReviewersList.length >= 6}
              className="sm:hidden flex items-center gap-1 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่ม</span>
            </button>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#666] hover:text-[#1A1918] hover:bg-[#EAE5DA] rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={savingReviewers}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#8C6D3F] hover:bg-[#735831] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {savedReviewersSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-300" />
                    <span>บันทึกสำเร็จ!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{savingReviewers ? 'กำลังบันทึก...' : 'บันทึกรายนามกรรมการ'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
