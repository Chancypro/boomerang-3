import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  server: {
    host: '0.0.0.0',
    port: 5173,
    fs: {
      allow: ['..']
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  }
});
