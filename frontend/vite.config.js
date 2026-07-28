import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Target modern browsers — matches browserslist in package.json
    target: ['es2020', 'chrome90', 'firefox88', 'safari15'],

    // 'hidden' in production: separate .map files accessible for debugging
    // without being linked from the bundle (so end-users don't see source).
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,

    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting:
         *
         * vendor-react  — React + ReactDOM  (very stable, long cache)
         * vendor-router — React Router      (changes occasionally)
         * vendor-icons  — MUI Icons         (large, very stable)
         * vendor-ui     — MUI + Emotion     (large, stable)
         * vendor-maps   — Leaflet           (large, stable)
         * vendor        — everything else from node_modules
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react';
          if (id.includes('/react-router') || id.includes('/react-router-dom/')) return 'vendor-router';
          if (id.includes('@mui/icons-material')) return 'vendor-icons';
          if (id.includes('@mui/') || id.includes('@emotion/')) return 'vendor-ui';
          if (id.includes('/leaflet') || id.includes('/react-leaflet')) return 'vendor-maps';

          return 'vendor';
        },
      },
    },

    // Raise the warning threshold slightly (default is 500 kB)
    chunkSizeWarningLimit: 600,
  },

  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api':     { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },

  preview: {
    port: 4173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
