/**
 * Image Optimization & Transformation Helper for ARTVARA
 * Supports ImageKit, Cloudinary, and Unsplash URL transformations
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  crop?: 'maintain_ratio' | 'pad_resize' | 'force';
}

/**
 * Transforms an image URL to an optimized size and format
 * @param url Remote or ImageKit URL
 * @param options Target width, quality, format
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: ImageTransformOptions = {}
): string {
  if (!url || typeof url !== 'string') return '';

  const { width = 800, quality = 80, format = 'auto' } = options;

  // 1. ImageKit (ik.imagekit.io)
  if (url.includes('ik.imagekit.io')) {
    const trParts: string[] = [];
    if (width) trParts.push(`w-${width}`);
    if (options.height) trParts.push(`h-${options.height}`);
    if (quality) trParts.push(`q-${quality}`);
    if (format) trParts.push(`f-${format}`);

    const trString = trParts.join(',');
    if (url.includes('?')) {
      const cleanUrl = url.replace(/([?&])tr=[^&]*(&|$)/, '$1').replace(/[?&]$/, '');
      const sep = cleanUrl.includes('?') ? '&' : '?';
      return `${cleanUrl}${sep}tr=${trString}`;
    }
    return `${url}?tr=${trString}`;
  }

  // 2. Cloudinary (res.cloudinary.com)
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const transform = `w_${width},q_${quality},f_${format},c_limit`;
    if (!url.includes('/upload/' + transform)) {
      return url.replace('/upload/', `/upload/${transform}/`);
    }
    return url;
  }

  // 3. Unsplash (images.unsplash.com)
  if (url.includes('images.unsplash.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&q=${quality}&auto=format`;
  }

  return url;
}
