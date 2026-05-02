/**
 * Vite configuration for Visualequ React frontend
 * Sets up React plugin, dev server proxy, and environment variables
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/math': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
