/**
 * Cloudinary URL transformation utilities
 * Handles responsive sizing, quality auto-optimization, and modern web formats (WebP/AVIF)
 */

interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'scale' | 'fit' | 'thumb';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  blur?: number;
}

export function getOptimizedImageUrl(
  url: string,
  options: CloudinaryTransformOptions = {}
): string {
  if (!url) return '/placeholder-art.jpg';

  // If already a full Cloudinary URL
  if (url.includes('res.cloudinary.com')) {
    const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options;
    const transforms: string[] = [];

    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (crop && (width || height)) transforms.push(`c_${crop}`);
    if (quality) transforms.push(`q_${quality}`);
    if (format) transforms.push(`f_${format}`);

    const transformString = transforms.join(',');
    return url.replace('/upload/', `/upload/${transformString}/`);
  }

  // If standard URL (e.g. Unsplash), return with optimized query params
  if (url.includes('images.unsplash.com')) {
    const u = new URL(url);
    if (options.width) u.searchParams.set('w', options.width.toString());
    if (options.quality) u.searchParams.set('q', typeof options.quality === 'number' ? options.quality.toString() : '80');
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
  }

  return url;
}
