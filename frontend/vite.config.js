import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Warn when a chunk exceeds 600 kB (default is 500 kB)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split large third-party libraries into separate chunks so the
        // browser can cache them independently of app code changes.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          pdf: ['jspdf'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
