import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  // ✅ Base pour GitHub Pages
  base: '/EtherWorld-Official-PC/',

  plugins: [
    react(),
    tailwindcss(),
  ],

  // ✅ Aliases — import propres partout dans le projet
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks':      resolve(__dirname, 'src/hooks'),
      '@store':      resolve(__dirname, 'src/store'),
      '@game':       resolve(__dirname, 'src/game'),
      '@lib':        resolve(__dirname, 'src/lib'),
      '@utils':      resolve(__dirname, 'src/utils'),
      '@data':       resolve(__dirname, 'src/data'),
      '@weapons':    resolve(__dirname, 'src/weapons'),
      '@pages':      resolve(__dirname, 'src/pages'),
    },
  },

  build: {
    target: 'esnext',
    minify: 'esbuild',

    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Three.js — le plus lourd, isolé seul
          if (id.includes('node_modules/three'))          return 'three'
          // React Three Fiber
          if (id.includes('@react-three/fiber'))          return 'r3f'
          // Drei — helpers R3F
          if (id.includes('@react-three/drei'))           return 'drei'
          // Rapier — physique
          if (id.includes('@react-three/rapier'))         return 'rapier'
          // Firebase — auth + firestore séparés
          if (id.includes('firebase/auth'))               return 'firebase-auth'
          if (id.includes('firebase/firestore'))          return 'firebase-firestore'
          if (id.includes('firebase'))                    return 'firebase-core'
          // Zustand — state management
          if (id.includes('zustand'))                     return 'state'
          // React — base
          if (id.includes('node_modules/react'))          return 'vendor-react'
          // Reste des node_modules
          if (id.includes('node_modules'))                return 'vendor'
        },
      },
    },

    chunkSizeWarningLimit: 2000,
  },

  optimizeDeps: {
    include: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'zustand',
    ],
  },

  server: {
    host: true,
    port: 5173,
  },
})