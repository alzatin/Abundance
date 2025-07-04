import { defineConfig } from 'vitest/config';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    nodePolyfills({
      // Be more selective about polyfills to avoid conflicts
      include: ['path', 'fs', 'process', 'buffer'],
      exclude: ['url', 'punycode'], // Exclude problematic polyfills
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    })
  ],
  resolve: {
    alias: {
      // Redirect the problematic dependency to our polyfilled version
      'replicad-opencascadejs/src/replicad_single.js': resolve('./tests/replicad_polyfill.js'),
    },
  },
  test: {
    environment: 'node', // Use 'jsdom' if you need browser APIs
    globals: true,       // So you can use describe/it/expect without imports
    setupFiles: ['./tests/setupVitestMocks.mjs'], // Load our setup/mocking file
    include: ['tests/**/*.test.{js,mjs,ts}', 'tests/**/*.integration.{js,mjs,ts}'],
    // You can add more config here as needed
  },
});
