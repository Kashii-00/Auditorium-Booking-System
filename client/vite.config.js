import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // base: '/event-management/client/', // Uncomment and set if deploying to a subfolder
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),    // ← match the tsconfig path
    },
  },
})
