// Vitest setup file to mock replicad-shrink-wrap and replicad-decorate
import { vi } from 'vitest';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

vi.mock('replicad-shrink-wrap', () => ({
  default: () => ({}),
}));

vi.mock('replicad-decorate', () => ({
  drawSVG: () => ({}),
}));

// Mock the WASM file import to return the correct file URL
vi.mock('replicad-opencascadejs/src/replicad_single.wasm?url', () => {
  const wasmPath = resolve(process.cwd(), 'node_modules/replicad-opencascadejs/src/replicad_single.wasm');
  return {
    default: fileURLToPath(`file://${wasmPath}`),
  };
});
