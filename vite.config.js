import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  server: {
    port: 3000,
    host: true
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          physics: ['cannon-es'],
          networking: ['socket.io-client']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'cannon-es', 'socket.io-client']
  }
})
