import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // Si el puerto está ocupado, usar el siguiente disponible
    host: true, // Exponer en la red local
    open: false, // No abrir el navegador automáticamente (evita errores en entornos sin GUI)
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
