import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative assets + HashRouter work on both root and GitHub Pages URLs.
  base: './',
});
