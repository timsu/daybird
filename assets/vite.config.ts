import { execSync } from 'child_process'
import path from 'path'
import analyze from 'rollup-plugin-analyzer'
import tsTreeshaking from 'rollup-plugin-ts-treeshaking'
import { defineConfig } from 'vite'
import { chunkSplitPlugin } from 'vite-plugin-chunk-split'

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

if (process.env.NODE_ENV != 'production') {
  process.stdin.resume()
}

// load global variables

const commitHash = execSync('git rev-parse HEAD').toString().trimEnd()
process.env.VITE_GIT_HASH = commitHash

const useAnalyzer = process.env.ANALYZE
  ? analyze({
      limit: 30,
    })
  : null

const outDir = '../priv/static'

const staticPath = path.join(__dirname, 'static')
const outPath = path.join(__dirname, outDir)
execSync(`rm -rf ${outPath}`)
execSync(`mkdir ${outPath}`)
execSync(`cp -r ${staticPath}/* ${outPath}`)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), tsTreeshaking(), useAnalyzer],
  server: {
    port: 3000,
    host: '0.0.0.0',
    origin: '//127.0.0.1:3000',
  },
  build: {
    outDir,
    cssCodeSplit: false,
    minify: true,
    manifest: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        landing: 'src/landing.tsx',
        auth: 'src/auth.tsx',
        app: 'src/app.tsx',
        insight: 'src/insight.tsx',
        addie: 'src/addie.tsx',
      },
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
        manualChunks: {
          tiptap: ['@tiptap/core'],
          preact: ['preact', 'preact-router', 'preact/compat'],
        },
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
