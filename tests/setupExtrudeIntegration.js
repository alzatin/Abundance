// Integration test setup for worker.js extrude (no mocks for replicad or related deps)

// Polyfill for Node.js WASM support
import { TextEncoder,TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill fetch for WASM loading
try {
  global.fetch = require('node-fetch');
} catch (e) {
  // If already available, do nothing
}

// Polyfill URL for WASM loading
import { URL, URLSearchParams } from 'url';
global.URL = URL;
global.URLSearchParams = URLSearchParams;
