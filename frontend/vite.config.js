import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    outDir: '../public',
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:5001', changeOrigin: true } },
  },
})
