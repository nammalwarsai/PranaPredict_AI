/**
 * Responsive design utilities
 */

// Breakpoints - mobile-first approach
const BREAKPOINTS = {
  xs: 0,      // Extra small: < 576px
  sm: 576,   // Small: >= 576px
  md: 768,   // Medium: >= 768px
  lg: 992,   // Large: >= 992px
  xl: 1200,  // Extra large: >= 1200px
  xxl: 1400   // Extra extra large: >= 1400px
};

// Media query strings
const MEDIA_QUERIES = {
  xs: `(min-width: ${BREAKPOINTS.xs}px)`,
  sm: `(min-width: ${BREAKPOINTS.sm}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  xxl: `(min-width: ${BREAKPOINTS.xxl}px)`,
  
  // Max-width queries
  xsDown: `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  smDown: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  mdDown: `(max-width: ${BREAKPOINTS.lg - 1}px)`,
  lgDown: `(max-width: ${BREAKPOINTS.xl - 1}px)`,
  xlDown: `(max-width: ${BREAKPOINTS.xxl - 1}px)`,
  
  // Range queries
  smOnly: `(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`,
  mdOnly: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  lgOnly: `(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`,
  xlOnly: `(min-width: ${BREAKPOINTS.xl}px) and (max-width: ${BREAKPOINTS.xxl - 1}px)`,
  
  // Orientation
  portrait: `(orientation: portrait)`,
  landscape: `(orientation: landscape)`,
  
  // Touch devices
  hover: `(hover: hover)`,
  pointer: `(pointer: fine)`,
  
  // Reduced motion
  reducedMotion: `(prefers-reduced-motion: reduce)`,
  
  // Color scheme
  darkMode: `(prefers-color-scheme: dark)`,
  lightMode: `(prefers-color-scheme: light)`,
  
  // High contrast
  highContrast: `(prefers-contrast: high)`,
  
  // Print
  print: 'print'
};

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint() {
  if (typeof window === 'undefined') return 'xs';
  
  const width = window.innerWidth;
  
  if (width >= BREAKPOINTS.xxl) return 'xxl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  
  return 'xs';
}

/**
 * Check if current screen matches breakpoint
 */
export function useBreakpoint(breakpoint) {
  if (typeof window === 'undefined') return false;
  
  const query = MEDIA_QUERIES[breakpoint];
  if (!query) return false;
  
  return window.matchMedia(query).matches;
}

/**
 * Get responsive value based on breakpoint
 */
export function getResponsiveValue(values) {
  if (typeof window === 'undefined') return values.xs || values.default;
  
  const breakpoint = getCurrentBreakpoint();
  return values[breakpoint] || values.default;
}

/**
 * Responsive grid column calculator
 */
export function calculateGridColumns({ 
  xs = 1, 
  sm = 2, 
  md = 3, 
  lg = 4, 
  xl = 5, 
  xxl = 6 
}) {
  const breakpoint = getCurrentBreakpoint();
  
  switch (breakpoint) {
    case 'xxl': return xxl;
    case 'xl': return xl;
    case 'lg': return lg;
    case 'md': return md;
    case 'sm': return sm;
    default: return xs;
  }
}

/**
 * Responsive spacing calculator
 */
export function getResponsiveSpacing({ 
  xs = '1rem', 
  sm = '1.5rem', 
  md = '2rem', 
  lg = '2.5rem', 
  xl = '3rem',
  xxl = '4rem'
}) {
  const breakpoint = getCurrentBreakpoint();
  
  switch (breakpoint) {
    case 'xxl': return xxl;
    case 'xl': return xl;
    case 'lg': return lg;
    case 'md': return md;
    case 'sm': return sm;
    default: return xs;
  }
}

/**
 * Responsive font size calculator
 */
export function getResponsiveFontSize({ 
  xs = '1rem', 
  sm = '1.1rem', 
  md = '1.2rem', 
  lg = '1.3rem',
  xl = '1.4rem',
  xxl = '1.5rem'
}) {
  const breakpoint = getCurrentBreakpoint();
  
  switch (breakpoint) {
    case 'xxl': return xxl;
    case 'xl': return xl;
    case 'lg': return lg;
    case 'md': return md;
    case 'sm': return sm;
    default: return xs;
  }
}

/**
 * Check if device is mobile
 */
export function isMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
}

/**
 * Check if device is tablet
 */
export function isTablet() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
}

/**
 * Check if device is desktop
 */
export function isDesktop() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.lg;
}

/**
 * Check if device has touch support
 */
export function hasTouchSupport() {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if device supports hover
 */
export function supportsHover() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia(MEDIA_QUERIES.hover).matches;
}

/**
 * Check if device prefers reduced motion
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MEDIA_QUERIES.reducedMotion).matches;
}

/**
 * Check if device prefers dark mode
 */
export function prefersDarkMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MEDIA_QUERIES.darkMode).matches;
}

/**
 * Check if device has high contrast preference
 */
export function prefersHighContrast() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MEDIA_QUERIES.highContrast).matches;
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions() {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element, threshold = 0) {
  if (!element || typeof window === 'undefined') return false;
  
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  
  return (
    rect.top >= -threshold &&
    rect.left >= 0 &&
    rect.bottom <= viewportHeight + threshold &&
    rect.right <= window.innerWidth
  );
}

/**
 * Scroll to element with smooth animation
 */
export function scrollToElement(element, options = {}) {
  if (!element || typeof window === 'undefined') return;
  
  const defaultOptions = {
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
    inline: 'nearest',
    ...options
  };
  
  element.scrollIntoView(defaultOptions);
}

/**
 * Scroll to top of page
 */
export function scrollToTop(options = {}) {
  if (typeof window === 'undefined') return;
  
  const defaultOptions = {
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    ...options
  };
  
  window.scrollTo({
    top: 0,
    left: 0,
    ...defaultOptions
  });
}

/**
 * Lock body scroll (for modals, dialogs)
 */
export function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  
  const scrollY = window.scrollY || window.pageYOffset;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  
  return scrollY;
}

/**
 * Unlock body scroll
 */
export function unlockBodyScroll(scrollY = 0) {
  if (typeof document === 'undefined') return;
  
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  
  window.scrollTo(0, scrollY);
}

/**
 * Get device pixel ratio for high DPI screens
 */
export function getDevicePixelRatio() {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Check if device is in portrait orientation
 */
export function isPortrait() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia(MEDIA_QUERIES.portrait).matches;
}

/**
 * Check if device is in landscape orientation
 */
export function isLandscape() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MEDIA_QUERIES.landscape).matches;
}

/**
 * Get orientation
 */
export function getOrientation() {
  return isPortrait() ? 'portrait' : 'landscape';
}

/**
 * Responsive image URL generator
 */
export function getResponsiveImageUrl(baseUrl, options = {}) {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // If no width/height provided, return base URL
  if (!width && !height) return baseUrl;
  
  // For Cloudinary or similar services
  if (baseUrl.includes('res.cloudinary.com') || baseUrl.includes('cloudinary.com')) {
    const parts = baseUrl.split('/upload/');
    if (parts.length === 2) {
      const transformations = [];
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      transformations.push(`q_${quality}`);
      transformations.push(`f_${format}`);
      
      return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
    }
  }
  
  // For Imgix
  if (baseUrl.includes('imgix.net')) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    const params = [];
    if (width) params.push(`w=${width}`);
    if (height) params.push(`h=${height}`);
    params.push(`q=${quality}`);
    params.push(`auto=format,compress`);
    
    return `${baseUrl}${separator}${params.join('&')}`;
  }
  
  // Default: return base URL
  return baseUrl;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(baseUrl, widths = [400, 800, 1200, 1600]) {
  return widths.map(width => {
    const url = getResponsiveImageUrl(baseUrl, { width, quality: 80 });
    return `${url} ${width}w`;
  }).join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(breakpoints = BREAKPOINTS) {
  const sizes = [];
  
  for (const [bp, width] of Object.entries(breakpoints)) {
    if (bp === 'xs') continue;
    sizes.push(`(min-width: ${width}px) ${Math.min(width / 12, 100)}vw`);
  }
  
  sizes.push('100vw');
  return sizes.join(', ');
}

export default {
  BREAKPOINTS,
  MEDIA_QUERIES,
  getCurrentBreakpoint,
  useBreakpoint,
  getResponsiveValue,
  calculateGridColumns,
  getResponsiveSpacing,
  getResponsiveFontSize,
  isMobile,
  isTablet,
  isDesktop,
  hasTouchSupport,
  supportsHover,
  prefersReducedMotion,
  prefersDarkMode,
  prefersHighContrast,
  getViewportDimensions,
  isInViewport,
  scrollToElement,
  scrollToTop,
  lockBodyScroll,
  unlockBodyScroll,
  getDevicePixelRatio,
  isPortrait,
  isLandscape,
  getOrientation,
  getResponsiveImageUrl,
  generateSrcSet,
  generateSizes
};
