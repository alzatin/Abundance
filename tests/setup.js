// Jest setup file
// Global test configuration and mocks

// Mock the replicad library as it requires WebAssembly
jest.mock('replicad', () => ({
  setOC: jest.fn(),
  drawRectangle: jest.fn().mockReturnValue({
    sketchOnPlane: jest.fn().mockReturnValue({
      extrude: jest.fn().mockReturnValue('mocked-geometry')
    })
  }),
  Vector: jest.fn().mockImplementation((coords) => ({
    Length: 1,
    dot: jest.fn().mockReturnValue(0),
    cross: jest.fn().mockReturnValue({ Length: 1 })
  })),
  Plane: jest.fn().mockImplementation(() => ({
    pivot: jest.fn().mockReturnThis()
  })),
  Solid: jest.fn(),
  Wire: jest.fn()
}));

// Mock replicad-opencascadejs
jest.mock('replicad-opencascadejs/src/replicad_single.js', () => 
  jest.fn().mockResolvedValue({})
);

// Mock replicad-opencascadejs wasm
jest.mock('replicad-opencascadejs/src/replicad_single.wasm?url', () => 'mocked-wasm-url');

// Mock replicad-shrink-wrap
jest.mock('replicad-shrink-wrap', () => jest.fn());

// Mock replicad-decorate
jest.mock('replicad-decorate', () => ({
  drawSVG: jest.fn().mockResolvedValue({
    boundingBox: { center: [0, 0] },
    clone: jest.fn().mockReturnThis(),
    translate: jest.fn().mockReturnThis()
  })
}));

// Mock comlink
jest.mock('comlink', () => ({
  expose: jest.fn(),
  proxy: jest.fn((fn) => fn)
}));

// Mock polygon-packer
jest.mock('polygon-packer', () => ({
  PolygonPacker: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn()
  })),
  PlacementWrapper: jest.fn()
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-1234')
}));

// Mock fonts
jest.mock('../src/js/fonts.js', () => ({}));

// Global test utilities
global.generateUniqueID = () => 'test-unique-id';

// Console suppression for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
