import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      commonjsOptions: {
        transformMixedEsModules: true
      },
      chunkSizeWarningLimit: 1600,
      target: 'esnext'
    },
    commonjsOptions: {
      transformMixedEsModules: true
    },
    chunkSizeWarningLimit: 1600,
    target: 'esnext'
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  }
}) 