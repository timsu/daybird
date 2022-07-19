import { execSync } from 'child_process'
import path from 'path'
import { defineConfig } from 'vite'

import preact from '@preact/preset-vite'

// allow phoenix to kill this process
process.stdin.on('close', function () {
  console.log('Received CLOSE on stdin')
  process.exit(0)
})
process.stdin.on('end', function () {
  console.log('Received END on stdin')
  process.exit(0)
})
process.stdin.resume()

// load global variables

const commitHash = execSync('git rev-parse HEAD').toString().trimEnd()
process.env.VITE_GIT_HASH = commitHash

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
      input: {
        landing: 'src/landing.tsx',
        auth: 'src/auth.tsx',
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
