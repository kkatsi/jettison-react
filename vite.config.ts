import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The four aliases are the layer names. They exist so every cross-layer import is
// syntactically recognisable — which is what lets oxlint.config.ts police them.
// Keep this list identical to `compilerOptions.paths` in tsconfig.json.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@app': path.resolve(import.meta.dirname, 'src/app'),
      '@modules': path.resolve(import.meta.dirname, 'src/modules'),
      '@shared': path.resolve(import.meta.dirname, 'src/shared'),
      '@core': path.resolve(import.meta.dirname, 'src/core'),
    },
  },
});
