import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5173,
    proxy: {
      '/health': 'http://127.0.0.1:8000',
      '/profile': 'http://127.0.0.1:8000',
      '/github': 'http://127.0.0.1:8000',
      '/job': 'http://127.0.0.1:8000',
      '/match': 'http://127.0.0.1:8000',
      '/generate': 'http://127.0.0.1:8000',
      '/files': 'http://127.0.0.1:8000',
    }
  }
})
