#!/usr/bin/env bun
/**
 * Build script for ve-tos-ts-sdk
 * Outputs ESM and CJS modules with TypeScript declarations
 */

import { $ } from 'bun'
import { rmSync, existsSync } from 'fs'

console.log('🚀 Building ve-tos-ts-sdk...\n')

// Clean dist directory
if (existsSync('./dist')) {
  console.log('🧹 Cleaning dist directory...')
  rmSync('./dist', { recursive: true, force: true })
}

console.log('📦 Building with Bun...')

// Build ESM
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'browser',
  format: 'esm',
  minify: false,
  sourcemap: 'external',
  naming: {
    entry: 'index.mjs'
  }
})

// Build CJS
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'node',
  format: 'cjs',
  minify: false,
  sourcemap: 'external',
  naming: {
    entry: 'index.cjs'
  }
})

// Build minified ESM
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'browser',
  format: 'esm',
  minify: true,
  sourcemap: 'external',
  naming: {
    entry: 'index.min.mjs'
  }
})

console.log('📝 Generating TypeScript declarations...')

// Generate TypeScript declarations
await $`bun x tsc --project tsconfig.build.json`

console.log('\n✅ Build complete!')
console.log('\nOutput files:')
console.log('  - dist/index.mjs (ESM)')
console.log('  - dist/index.cjs (CommonJS)')
console.log('  - dist/index.min.mjs (ESM minified)')
console.log('  - dist/index.d.ts (TypeScript declarations)')

