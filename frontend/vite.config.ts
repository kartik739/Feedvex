import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  envDir: '../',
  plugins: [react()],
  resolve: {
    // Look for modules in root node_modules since frontend has no package.json
    modules: [path.resolve(__dirname, '../node_modules'), 'node_modules'],
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          clerk: ['@clerk/clerk-react'],
          ui: ['lucide-react'],
          state: ['zustand'],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', '@clerk/clerk-react'],
  },
});
