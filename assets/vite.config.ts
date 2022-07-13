import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import path from 'path'

// allow phoenix to kill this process
process.stdin.on('close', function () {
  process.exit(0)
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    origin: '//127.0.0.1:3000',
  },
  build: {
    outDir: '../priv/static',
    // generate manifest.json in outDir
    manifest: true,
    cssCodeSplit: false,
    rollupOptions: {
      // overwrite default .html entry
      input: {
        landing: 'src/landing.tsx',
        app: 'src/app.tsx',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    define: {
      this: 'window',
    },
  },
})
