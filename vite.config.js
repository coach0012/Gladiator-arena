import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});
