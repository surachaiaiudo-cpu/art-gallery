'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  pageNumber?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PlateErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Catalog Plate Render Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="catalog-a4-page w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] p-[15mm] bg-white border border-red-200 shadow-2xl mx-auto rounded-sm flex flex-col justify-between overflow-hidden relative box-border text-center">
          <div className="my-auto flex flex-col items-center justify-center space-y-3 p-8">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h3 className="font-serif text-lg font-bold text-neutral-800">
              เกิดข้อผิดพลาดในการแสดงผลหน้านี้ (Page #{this.props.pageNumber || '?'})
            </h3>
            <p className="text-xs text-neutral-500 max-w-md">
              ไม่สามารถโหลดข้อมูลรูปภาพหรือเนื้อหาได้ แต่ยังคงสามารถพิมพ์และเปิดอ่านหน้าอื่นๆ ได้ตามปกติ
            </p>
          </div>
          <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-[10px] text-[#777]">
            <span>ARTVARA Official Catalog</span>
            <span className="font-mono text-[#555] font-semibold">{this.props.pageNumber || ''}</span>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
