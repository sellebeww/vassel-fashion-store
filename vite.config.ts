import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // Set DISABLE_HMR=true when live reload is not needed.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Skip file watching when live reload is disabled.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
