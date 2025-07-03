# Worker.js Testing Guide

This directory contains unit tests for the worker.js functions in the Abundance project.

## Test Structure

```
tests/
├── setup.js                    # Jest setup and global mocks for unit tests
├── setupIntegration.js         # Jest setup for integration tests (real WASM)
├── workerTestUtils.js          # Test utilities and helpers
├── workerFunctions.js          # Testable versions of worker functions
├── worker.test.js              # Core utility function tests (mocked)
├── workerIntegration.test.js   # Integration tests (mocked dependencies)
├── workerValidation.test.js    # Security and validation tests (mocked)
└── workerWasmIntegration.test.js # Real WASM integration tests
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run jest

# Re-run tests whenever test or source code changes
npm run jest:watch

# Run tests with coverage report
npm run jest:coverage
```

### Advanced Test Commands

```bash
# Run only unit tests (fast, mocked)
npx jest --selectProjects unit

# Run only integration tests (real WASM, slower)
npx jest --selectProjects integration

# Run specific test file
npx jest tests/worker.test.js

# Run tests matching a pattern
npx jest --testNamePattern="toGeometry"

# Run tests with verbose output
npx jest --verbose

# Skip WASM tests (useful in CI)
SKIP_WASM_TESTS=1 npx jest

# Run with verbose WASM loading info
VERBOSE_TESTS=1 npx jest --selectProjects integration
```

## Test Categories

### 1. Core Utility Functions (`worker.test.js`)

Tests for fundamental utility functions:

- `toGeometry` - Geometry conversion and lookup
- `isAssembly` - Assembly detection
- `is3D` - 3D geometry detection
- `actOnLeafs` - Recursive assembly processing
- `flattenAssembly` - Assembly flattening
- `getBounds` - Bounding box calculation
- `validateUserCode` - Code security validation
- `calculateZoom` - Camera zoom calculation
- `areaApprox` - Area approximation

### 2. Integration Tests (`workerIntegration.test.js`)

Tests for complex operations:

- Nested assembly handling
- Library integration
- Error handling
- Performance with large datasets
- Edge cases

### 3. Validation Tests (`workerValidation.test.js`)

Tests for security and validation:

- Code validation against dangerous patterns
- Zoom calculation edge cases
- Input validation
- Error handling

## Test Utilities

### Mock Objects

The test utilities provide several mock objects:

```javascript
import {
  mockLibrary,
  createMockGeometry,
  createMockAssembly,
  testData,
} from "./workerTestUtils.js";

// Use pre-built test data
const geometry = testData.simpleSketch;
const assembly = testData.assembly;

// Create custom mocks
const customGeometry = createMockGeometry({
  boundingBox: {
    bounds: [
      [0, 0, 0],
      [20, 20, 20],
    ],
  },
});
const customAssembly = createMockAssembly(5); // 5 parts
```

### Test Functions

Testable versions of worker functions are available:

```javascript
import {
  toGeometry,
  isAssembly,
  getBounds,
  setTestLibrary,
} from "./workerFunctions.js";

// Set up test library
setTestLibrary({ "test-id": mockGeometry });

// Test functions
const result = toGeometry("test-id");
const bounds = getBounds(result);
```

## Mocking Strategy

### Test Types

We use two different test configurations:

#### 1. Unit Tests (Mocked Dependencies)

- **Files**: `worker.test.js`, `workerValidation.test.js`
- **Setup**: `setup.js`
- **Strategy**: Mock all external dependencies including replicad
- **Purpose**: Fast, isolated testing of business logic

#### 2. Integration Tests (Real Dependencies)

- **Files**: `workerWasmIntegration.test.js`
- **Setup**: `setupIntegration.js`
- **Strategy**: Use real replicad with actual OpenCascade WASM
- **Purpose**: Test actual geometry operations and WASM integration

### External Dependencies

#### Unit Tests Mock:

- **replicad**: Mocked with simplified geometry objects
- **WebAssembly**: Mocked to avoid loading actual WASM files
- **Web Workers**: Mocked for Node.js environment
- **File APIs**: Mocked for testing file operations

#### Integration Tests Use Real:

- **replicad**: Real library with full geometry capabilities
- **OpenCascade WASM**: Actual WASM modules loaded in Node.js
- **Geometry Operations**: Real boolean operations, transformations, etc.

### Worker-Specific Mocks

- **Library**: In-memory object for testing geometry storage
- **Geometry Objects**: Real replicad objects in integration tests
- **Bounding Boxes**: Real coordinate data from OpenCascade

## Writing New Tests

### 1. For New Utility Functions

```javascript
describe("newFunction", () => {
  test("should handle normal case", () => {
    const input = createMockGeometry();
    const result = newFunction(input);
    expect(result).toBeDefined();
  });

  test("should handle edge case", () => {
    expect(() => newFunction(null)).toThrow();
  });
});
```

### 2. For Complex Operations

```javascript
describe("complexOperation", () => {
  beforeEach(() => {
    setTestLibrary(mockLibrary);
  });

  test("should process assembly correctly", () => {
    const assembly = createMockAssembly(3);
    const result = complexOperation(assembly);
    expect(isAssembly(result)).toBe(true);
  });
});
```

### 3. For Integration Tests

```javascript
describe("Feature Integration", () => {
  test("should work end-to-end", () => {
    // Set up
    const input = setupTestData();

    // Execute
    const step1 = functionA(input);
    const step2 = functionB(step1);
    const result = functionC(step2);

    // Verify
    expect(result).toMatchExpectedOutput();
  });
});
```

## Performance Testing

For performance-sensitive functions, include timing tests:

```javascript
test("should handle large datasets efficiently", () => {
  const largeData = createLargeTestData(1000);
  const startTime = Date.now();

  const result = expensiveFunction(largeData);

  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(1000); // 1 second
  expect(result).toBeValid();
});
```

## Debugging Tests

### Common Issues

1. **Mock not working**: Check that mocks are set up in `setup.js`
2. **Async issues**: Ensure async functions are properly awaited
3. **Library state**: Clear test library between tests
4. **Memory leaks**: Reset mocks and clear data in `afterEach`

### Debugging Commands

```bash
# Run single test with detailed output
npx jest --testNamePattern="specific test" --verbose

# Run tests without coverage (faster)
npx jest --no-coverage

# Debug with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Coverage Goals

Aim for:

- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

View coverage report:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Contributing

When adding new worker functions:

1. Add the function to `workerFunctions.js` (testable version)
2. Create tests in the appropriate test file
3. Add mocks for any new dependencies in `setup.js`
4. Update this README if needed

## Troubleshooting

### Common Test Failures

1. **Module not found**: Check import paths and mocks
2. **Timeout errors**: Increase timeout in jest.config.js
3. **Memory issues**: Clear mocks and data between tests
4. **Flaky tests**: Check for unhandled promises or state leaks

### Getting Help

- Check Jest documentation: https://jestjs.io/docs/
- Review existing tests for patterns
- Use `console.log` in tests for debugging (remove before committing)
