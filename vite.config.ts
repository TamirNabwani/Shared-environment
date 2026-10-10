import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `vite build --mode single` inlines all JS/CSS into one self-contained index.html
// (used for hosting the app as a single page, e.g. a claude.ai artifact).
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  base: './',
  build: mode === 'single' ? { outDir: 'dist-single' } : {},
  test: {
    environment: 'node',
  },
}) as never);
