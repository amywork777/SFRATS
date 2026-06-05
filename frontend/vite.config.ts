import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/.*/]
    },
    chunkSizeWarningLimit: 2000,
    target: 'esnext',
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return
        if (warning.code === 'THIS_IS_UNDEFINED') return
        warn(warning)
      }
    }
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    tsconfigRaw: {
      compilerOptions: {
        jsx: 'react-jsx',
        jsxImportSource: 'react'
      }
    }
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
    include: ['@supabase/supabase-js', 'nominatim-browser', 'react', 'react-dom'],
    esbuildOptions: {
      target: 'esnext',
      supported: { 
        'top-level-await': true 
      },
    }
  }
}) 