import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Shims process.env for the browser, ensuring Gemini API key is available
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  server: {
    port: 3000,
  },
  build: {
    // Resolves the 'Adjust chunk size limit' warning
    chunkSizeWarningLimit: 1000,
    // Ensures assets are handled correctly relative to the project root
    outDir: 'dist',
    sourcemap: false
  }
});