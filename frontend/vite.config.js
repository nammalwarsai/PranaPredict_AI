import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for better development experience
      fastRefresh: true,
      // Enable Babel for better compatibility
      babel: {
        presets: ['@babel/preset-react'],
        plugins: [
          ['@babel/plugin-transform-react-jsx', {
            runtime: 'automatic'
          }]
        ]
      }
    })
  ],
  build: {
    // Enable minification for production
    minify: 'esbuild',
    
    // Warn when a chunk exceeds 500 kB
    chunkSizeWarningLimit: 500,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Enable sourcemap for debugging
    sourcemap: false,
    
    // Optimize for production
    rollupOptions: {
      output: {
        // Split large third-party libraries into separate chunks
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          pdf: ['jspdf', 'jspdf-autotable'],
          supabase: ['@supabase/supabase-js'],
          axios: ['axios'],
          utils: ['dompurify']
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
    
    // Enable better caching
    write: true,
    
    // Enable parallel builds
    parallel: true
  },
  
  // Enable HTTP/2 push for better performance
  server: {
    headers: {
      'Link': '</assets/react-[hash].js>; rel=preload; as=script',
      'Link': '</assets/charts-[hash].js>; rel=preload; as=script'
    }
  },
  
  // Enable better asset handling
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.gif'],
  
  // Enable better JSON handling
  json: {
    namedExports: true,
    stringify: true
  },
  
  // Enable better CSS handling
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/design-system.css";`
      }
    },
    modules: {
      localsConvention: 'camelCase'
    }
  },
  
  // Enable better optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'chart.js',
      'react-chartjs-2'
    ],
    exclude: []
  },
  
  // Enable better preview
  preview: {
    port: 4173,
    strictPort: true
  }
})
