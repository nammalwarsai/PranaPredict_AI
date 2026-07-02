import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Performance optimization: Preload critical resources
const preloadCriticalResources = () => {
  // Preload fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap';
  fontLink.as = 'style';
  document.head.appendChild(fontLink);

  // Preload critical CSS
  const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
  cssLinks.forEach(link => {
    link.media = 'print';
    link.onload = () => {
      link.media = 'all';
    };
  });
};

// Initialize performance monitoring
const initPerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'development') {
    // Mark critical timing points
    window.performanceMarks = {
      appStart: performance.now(),
      domLoaded: performance.now()
    };

    // Log performance metrics
    window.addEventListener('load', () => {
      const loadTime = performance.now() - window.performanceMarks.appStart;
      console.log(`Page fully loaded in ${loadTime.toFixed(2)}ms`);
    });
  }
};

// Initialize accessibility features
const initAccessibility = () => {
  // Add focus-visible polyfill if needed
  if (!('focusVisible' in document)) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  // Ensure skip links work properly
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus();
      }
    });
  }
};

// Initialize the application
const initApp = () => {
  // Preload critical resources
  preloadCriticalResources();

  // Initialize performance monitoring
  initPerformanceMonitoring();

  // Initialize accessibility features
  initAccessibility();

  // Create root and render app
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  // Use createRoot for better performance
  const root = createRoot(rootElement);

  // Render the app
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // Mark app as hydrated
  document.documentElement.classList.add('hydrated');

  // Log hydration time in development
  if (process.env.NODE_ENV === 'development') {
    const hydrationTime = performance.now() - window.performanceMarks.appStart;
    console.log(`App hydrated in ${hydrationTime.toFixed(2)}ms`);
  }
};

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
