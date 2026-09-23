import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' makes asset paths relative, so the site works on GitHub Pages
export default defineConfig({ plugins: [react()], base: './' })
