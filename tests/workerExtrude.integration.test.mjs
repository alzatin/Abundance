// Integration test for extrude in worker.js using real replicad and WASMco
import * as replicad from 'replicad';
import opencascade from 'replicad-opencascadejs/src/replicad_single.js';
import * as worker from '../src/worker.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Patch global library for worker.js
let library;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

beforeAll(async () => {
  // Load OpenCascade WASM and set in replicad
  const OC = await opencascade({
    locateFile: () => require('path').resolve(
      '../node_modules/replicad-opencascadejs/src/replicad_single.wasm'
    ),
  });
  replicad.setOC(OC);

  // Patch global library for worker.js
  library = {};
  // worker.js expects a global 'library' variable
  global.library = library;
});

afterEach(() => {
  // Reset library after each test
  for (const key of Object.keys(library)) delete library[key];
});

describe('worker.js extrude integration', () => {
  it('extrudes a rectangle sketch into a 3D box', async () => {
    // 1. Create a 2D rectangle in the library
    const inputID = 'rect1';
    const targetID = 'box1';
    const width = 10;
    const height = 5;
    const extrudeHeight = 3;

    // Use real replicad to create a 2D rectangle sketch
    const rect = replicad.drawRectangle(width, height);
    const sketch = rect.sketchOnPlane();
    library[inputID] = {
      geometry: [sketch],
      tags: [],
      plane: undefined,
      color: '#aad7f2',
      bom: []
    };

    // 2. Call extrude
    await worker.extrude(targetID, inputID, extrudeHeight);

    // 3. Check the result in the library
    const result = library[targetID];
    expect(result).toBeDefined();
    expect(result.geometry).toHaveLength(1);
    const solid = result.geometry[0];
    expect(solid).toBeDefined();
    expect(solid.boundingBox).toBeDefined();
    // Check bounding box dimensions
    const bounds = solid.boundingBox;
    expect(bounds.width).toBeCloseTo(width, 1);
    expect(bounds.height).toBeCloseTo(height, 1);
    expect(bounds.depth).toBeCloseTo(extrudeHeight, 1);
  });
});
