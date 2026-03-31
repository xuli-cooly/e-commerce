import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import qiankun from 'vite-plugin-qiankun'

const useDevMode = true

export default defineConfig({
  plugins: [
    react(),
    qiankun('admin-community', { useDevMode }),
  ],
  base: '/',
  server: {
    port: 3002,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    proxy: {
      '/api': 'http://localhost:8000',
      '/static': 'http://localhost:8000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
