import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Warn when a chunk exceeds 500 kB
    chunkSizeWarningLimit: 500,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Enable minification for production
    minify: 'esbuild',
    
    // Optimize for production
    rollupOptions: {
      output: {
        // Split large third-party libraries into separate chunks so the
        // browser can cache them independently of app code changes.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          pdf: ['jspdf', 'jspdf-autotable'],
          supabase: ['@supabase/supabase-js'],
        },
        
        // Enable better chunk naming
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        
        // Enable better compression
        compact: true
      },
      
      // Enable tree-shaking
      treeshake: 'recommended'
    },
    
    // Enable parallel builds
    parallel: true
  },
  
  // Enable better asset handling
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.gif'],
  
  // Enable better optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'chart.js',
      'react-chartjs-2'
    ]
  },
  
  // Enable better preview
  preview: {
    port: 4173,
    strictPort: true
  }
})
