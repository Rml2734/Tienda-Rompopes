
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
  }
});