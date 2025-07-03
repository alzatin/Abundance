// ESM support for Jest
export default {
  // Use projects to separate unit tests from integration tests
  projects: [
/*    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/workerExtrude.integration.test.js',
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setupExtrudeIntegration.js'],
      transform: {
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        'replicad-opencascadejs/src/replicad_single.js': '<rootDir>/tests/__mocks__/replicad-opencascadejs.js',
        'replicad-opencascadejs/src/replicad_single.wasm\\?url': '<rootDir>/tests/__mocks__/wasm-url.js',
        'replicad-shrink-wrap': '<rootDir>/tests/__mocks__/replicad-shrink-wrap.js',
        'replicad-decorate': '<rootDir>/tests/__mocks__/replicad-decorate.js',
        'polygon-packer': '<rootDir>/tests/__mocks__/polygon-packer.js',
        '^uuid$': '<rootDir>/tests/__mocks__/uuid.js'
      }
    },*/
/*    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/workerWasmIntegration.test.js'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setupIntegration.js'],
      transform: {
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      testTimeout: 45000, // Longer timeout for WASM loading
      slowTestThreshold: 15
    },*/
    {
      displayName: 'extrude-integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/workerExtrude.integration.test.mjs'],
      setupFilesAfterEnv: ['<rootDir>/tests/setupExtrudeIntegration.js'],
      transform: {
        '^.+\\.[tj]sx?$': 'babel-jest',
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        'replicad-shrink-wrap': '<rootDir>/tests/__mocks__/replicad-shrink-wrap.js',
        'replicad-decorate': '<rootDir>/tests/__mocks__/replicad-decorate.js',
        'polygon-packer': '<rootDir>/tests/__mocks__/polygon-packer.js',
        '\\.wasm$': '<rootDir>/tests/__mocks__/wasm-url.js',
      },
      testTimeout: 30000
    },
  ],
  
  // Global settings
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
    '!src/index.jsx'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transformIgnorePatterns: [
    "/node_modules/"
  ],
  verbose: true
};
