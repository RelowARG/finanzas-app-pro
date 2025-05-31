import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.0.7', // Agregado para exponer el servidor en la red local
    port: 5173, // Puedes especificar un puerto si lo deseas, o dejar que Vite use el predeterminado
    proxy: {
      '/api': {
        target: 'http://192.168.0.7:5001', // Actualizado para apuntar al backend en la nueva IP
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
