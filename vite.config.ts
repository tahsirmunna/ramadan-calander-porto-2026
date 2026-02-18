import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This shims process.env for the browser, allowing the Gemini SDK to find the key
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  server: {
    port: 3000,
  },
  build: {
    // Resolves the 'Adjust chunk size limit' warning during build
    chunkSizeWarningLimit: 1000,
    outDir: 'dist',
    sourcemap: false
  }
});