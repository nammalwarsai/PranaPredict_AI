import { useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Hook to track and optimize component rendering performance
 */
export function usePerformanceOptimization() {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  
  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;
    
    // Log excessive re-renders in development
    if (process.env.NODE_ENV === 'development' && renderCount.current > 10) {
      console.warn(`Component re-rendered ${renderCount.current} times`);
    }
    
    // Warn about rapid re-renders
    if (timeSinceLastRender < 16) {
      console.warn('Rapid re-renders detected - consider debouncing or throttling');
    }
  }, []);
}

/**
 * Hook to debounce function calls for performance
 */
export function useDebounce(callback, delay = 300) {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

/**
 * Hook to throttle function calls
 */
export function useThrottle(callback, limit = 100) {
  const lastCall = useRef(0);
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    const now = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (now - lastCall.current >= limit) {
      lastCall.current = now;
      callback(...args);
    } else {
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, limit - (now - lastCall.current));
    }
  }, [callback, limit]);
}

/**
 * Hook to detect if component is in viewport for lazy loading
 */
export function useInViewport(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);
  
  const defaultOptions = useMemo(() => ({
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options
  }), [options]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
      }
    }, defaultOptions);
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [defaultOptions]);
  
  return [elementRef, isVisible];
}

/**
 * Hook to preload resources
 */
export function usePreloadResource(url, as = 'image') {
  useEffect(() => {
    if (!url) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;
    
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, [url, as]);
}

/**
 * Hook to optimize scroll performance
 */
export function useOptimizedScroll() {
  const scrollTimeout = useRef(null);
  
  const handleScroll = useCallback(() => {
    // Add scroll optimization logic here
    document.body.classList.add('is-scrolling');
    
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      document.body.classList.remove('is-scrolling');
    }, 100);
  }, []);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
}
