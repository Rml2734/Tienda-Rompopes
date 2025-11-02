/*
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
*/

import { defineConfig } from 'vite';

export default defineConfig({
  // Base path es crucial para producción, asegura que las rutas estáticas funcionen
  base: './', 
  
  build: {
    rollupOptions: {
      input: {
        // ✅ CORRECCIÓN: Los tres archivos HTML están ahora en la raíz
        main: './index.html',
        checkout: './checkout.html',
        tracking: './tracking.html' // ✅ Importante agregar la página de tracking
      }
    }
  },

  server: {
    // Configuración para desarrollo local
    open: '/'
  },
  
  // La configuración 'preview' no es necesaria para un despliegue estático simple
  // en Railway. Puedes dejarla o eliminarla.
});
