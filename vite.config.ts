import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // dominio de un tunel https temporal (cloudflared), solo si se abre uno
    allowedHosts: ['.trycloudflare.com'],
    // Para probar desde un telefono en la misma red (VITE_API_URL vacio): la
    // app y la API salen por el mismo origen y Vite reenvia /api al backend.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        // Por el proxy la llamada ya es del mismo origen: sin quitar el Origin
        // (p. ej. http://192.168.1.14:5173) el CORS del backend la rechaza.
        configure: (proxy) => {
          proxy.on('proxyReq', (req) => req.removeHeader('origin'))
        },
      },
    },
  },
})
