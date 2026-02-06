
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // يجعل المسارات نسبية لتعمل على GitHub Pages دون مشاكل
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  }
});
