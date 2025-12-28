import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.VITE_DEV_SERVER_PORT || '5173', 10),
    ...(process.env.VITE_API_PROXY_TARGET || process.env.VITE_API_BASE_URL ? {
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || process.env.VITE_API_BASE_URL.replace('/api', ''),
          changeOrigin: true,
        }
      }
    } : {}),
  }
})

