import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        checkout: './src/checkout.html'
      }
    }
  },
  server: {
    open: '/'
  },
  // --- ¡NUEVA CONFIGURACIÓN AQUÍ! ---
  preview: {
    // Permite que Railway acceda al servidor preview de Vite
    allowedHosts: ['tienda-rompopes-production.up.railway.app']
  }
});