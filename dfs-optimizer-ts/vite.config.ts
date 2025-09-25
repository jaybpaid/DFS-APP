import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/dk': {
        target: 'https://api.draftkings.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/dk/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
