// Adobe PDF Services Monthly Quota Management
// Free Tier Quota: 500 requests per month

export const MAX_MONTHLY_ADOBE_PDF_QUOTA = 500;

export interface AdobeQuotaStatus {
  monthKey: string;
  monthName: string;
  used: number;
  max: number;
  remaining: number;
  percentUsed: number;
  isExceeded: boolean;
}

/**
 * Returns current month string in YYYY-MM format (e.g. "2026-09")
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns human-readable Thai month and year (e.g. "กันยายน 2569")
 */
export function getCurrentMonthThaiName(): string {
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const now = new Date();
  const monthIndex = now.getMonth();
  const yearBE = now.getFullYear() + 543;
  return `${thaiMonths[monthIndex]} ${yearBE}`;
}

/**
 * Get current month's Adobe PDF usage and quota status
 */
export function getAdobeMonthlyUsage(): AdobeQuotaStatus {
  const monthKey = getCurrentMonthKey();
  const monthName = getCurrentMonthThaiName();
  let used = 0;

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(`artvara_adobe_quota_${monthKey}`);
    if (raw) {
      used = parseInt(raw, 10) || 0;
    }
  }

  const remaining = Math.max(0, MAX_MONTHLY_ADOBE_PDF_QUOTA - used);
  const percentUsed = Math.min(100, Math.round((used / MAX_MONTHLY_ADOBE_PDF_QUOTA) * 100));
  const isExceeded = used >= MAX_MONTHLY_ADOBE_PDF_QUOTA;

  return {
    monthKey,
    monthName,
    used,
    max: MAX_MONTHLY_ADOBE_PDF_QUOTA,
    remaining,
    percentUsed,
    isExceeded,
  };
}

/**
 * Increment usage counter after a successful Adobe PDF generation
 */
export function incrementAdobeUsage(count: number = 1): AdobeQuotaStatus {
  const monthKey = getCurrentMonthKey();
  let currentUsed = 0;

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(`artvara_adobe_quota_${monthKey}`);
    if (raw) {
      currentUsed = parseInt(raw, 10) || 0;
    }
    const newCount = currentUsed + count;
    localStorage.setItem(`artvara_adobe_quota_${monthKey}`, String(newCount));
  }

  return getAdobeMonthlyUsage();
}