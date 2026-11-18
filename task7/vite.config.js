import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Files from /public that belong to the app shell (built JS/CSS are added automatically).
const PUBLIC_SHELL_FILES = [
  './',
  'offline.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

/**
 * After the build, fills the placeholders in dist/sw.js with:
 *  - the build version (so every deploy gets a new precache name),
 *  - the list of files to pre-cache (hashed JS/CSS from Vite + public shell files).
 */
function pwaPrecache() {
  let outDir;
  return {
    name: 'pwa-precache',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    writeBundle(_options, bundle) {
      const swPath = resolve(outDir, 'sw.js');
      const urls = [...PUBLIC_SHELL_FILES, ...Object.keys(bundle)];
      const sw = readFileSync(swPath, 'utf8')
        .replace('__APP_VERSION__', Date.now().toString(36))
        .replace('__PRECACHE_URLS__', JSON.stringify(urls, null, 2));
      writeFileSync(swPath, sw);
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/react-js_script/' : '/',
  plugins: [react(), pwaPrecache()],
  server: {
    port: 5173,
    open: true,
  },
}));
