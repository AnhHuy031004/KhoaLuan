import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const e = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    build: { target: 'es2022' },
    resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
    server: {
      host: '127.0.0.1',
      proxy: e.VITE_USE_MOCK === 'false' ? {
        '/backend': {
          target: e.API_PROXY_TARGET || 'https://vovinamapinode.onrender.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/backend/, '/api/v1'),
        },
      } : {},
    },
  };
});
