// Modern Website Optimization Utilities
// Based on 2025 global competitive standards

export interface PerformanceMetrics {
  loading: boolean;
  error?: string;
  lastUpdated: number;
}

export interface ModernAnimationOptions {
  duration?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  delay?: number;
  once?: boolean;
}

// Smooth scroll with performance optimization
export const smoothScrollTo = (elementId: string, offset: number = 0) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

// Modern intersection observer for animations
export const useIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  };

  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    return new IntersectionObserver(callback, defaultOptions);
  }
  return null;
};

// Optimized image loading with lazy loading
export const createOptimizedImage = (
  src: string,
  alt: string,
  fallbackInitial?: string
): string => {
  if (!src) {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="hsl(var(--accent-primary) / 0.1)"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="system-ui" font-size="24" fill="hsl(var(--accent-primary))">
          ${fallbackInitial || alt.charAt(0).toUpperCase()}
        </text>
      </svg>
    `)}`;
  }
  return src;
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof performance !== 'undefined') {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
  } else {
    fn();
  }
};

// Optimized debounce for search and form inputs
export const debounce = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

// Modern form validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

// Color utilities for dynamic theming
export const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Modern typography utilities
export const getOptimalFontSize = (containerWidth: number): number => {
  if (containerWidth < 768) return 14; // Mobile
  if (containerWidth < 1024) return 16; // Tablet
  return 18; // Desktop
};

// Performance-optimized state management
export const createOptimizedState = <T>(initialValue: T) => {
  let value = initialValue;
  const subscribers = new Set<(value: T) => void>();

  return {
    get: () => value,
    set: (newValue: T) => {
      if (newValue !== value) {
        value = newValue;
        subscribers.forEach(callback => callback(value));
      }
    },
    subscribe: (callback: (value: T) => void) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    }
  };
};

// Modern error boundary utilities
export const createErrorHandler = (componentName: string) => {
  return (error: Error, errorInfo?: any) => {
    console.error(`Error in ${componentName}:`, error, errorInfo);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics/error tracking
      console.log('Would send error to tracking service:', { error, componentName });
    }
  };
};

// SEO and social media utilities
export const generatePageMeta = (title: string, description: string, image?: string) => {
  return {
    title: `${title} | Carelwave Media`,
    description,
    openGraph: {
      title,
      description,
      image: image || '/og-default.jpg',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: image || '/og-default.jpg'
    }
  };
};

// Modern accessibility utilities
export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
};

// Progressive enhancement utilities
export const supportsFeature = (feature: string): boolean => {
  switch (feature) {
    case 'intersectionObserver':
      return 'IntersectionObserver' in window;
    case 'webgl':
      return !!document.createElement('canvas').getContext('webgl');
    case 'serviceWorker':
      return 'serviceWorker' in navigator;
    case 'pushNotifications':
      return 'PushManager' in window;
    default:
      return false;
  }
};

export default {
  smoothScrollTo,
  useIntersectionObserver,
  createOptimizedImage,
  measurePerformance,
  debounce,
  validateEmail,
  validateRequired,
  hexToHsl,
  getOptimalFontSize,
  createOptimizedState,
  createErrorHandler,
  generatePageMeta,
  announceToScreenReader,
  supportsFeature
}; 