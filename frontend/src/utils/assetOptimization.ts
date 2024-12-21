/**
 * Asset Optimization Utilities
 * Provides helpers for optimizing images and other assets
 */

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(baseUrl: string, sizes: number[]): string {
  return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(breakpoints: { maxWidth: string; size: string }[]): string {
  return breakpoints.map((bp) => `(max-width: ${bp.maxWidth}) ${bp.size}`).join(', ');
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}

/**
 * Check if WebP is supported
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Get optimized image URL based on device pixel ratio
 */
export function getOptimizedImageUrl(baseUrl: string, width: number): string {
  const dpr = window.devicePixelRatio || 1;
  const optimizedWidth = Math.round(width * dpr);
  return `${baseUrl}?w=${optimizedWidth}&q=80&fm=webp`;
}

/**
 * Lazy load CSS
 */
export function loadCSS(href: string): void {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print';
  link.onload = () => {
    link.media = 'all';
  };
  document.head.appendChild(link);
}

/**
 * Prefetch resource
 */
export function prefetchResource(url: string, as: string = 'fetch'): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Preconnect to domain
 */
export function preconnect(url: string): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Get image dimensions from URL
 */
export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Compress image quality based on connection speed
 */
export function getOptimalQuality(): number {
  // @ts-ignore - navigator.connection is experimental
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) return 80; // Default quality

  const effectiveType = connection.effectiveType;

  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 50;
    case '3g':
      return 65;
    case '4g':
    default:
      return 80;
  }
}

/**
 * Create placeholder for image
 */
export function createPlaceholder(width: number, height: number, color: string = '#f3f4f6'): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='${encodeURIComponent(
    color
  )}' width='${width}' height='${height}'/%3E%3C/svg%3E`;
}
