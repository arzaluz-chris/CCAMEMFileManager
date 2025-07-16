import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // Si el puerto está ocupado, usar el siguiente disponible
    host: true, // Exponer en la red local
    open: true, // Abrir el navegador automáticamente
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  resolve: {
    alias: {
      '@': '/src' // Alias para importaciones más limpias
    }
  }
})