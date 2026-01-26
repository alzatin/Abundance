# Puppeteer Tests

This directory contains Puppeteer-based tests for the Abundance application.

## Test Files

### index.js
The main Puppeteer test that:
- Tests project rendering for projects in `projects_to_test.js`
- Takes screenshots of rendered projects
- Tests both local and deployed versions
- Runs on every pull request

**Usage:**
```bash
npm test
```

### metrics.js
Performance metrics test that measures:
- **Cold Load Time**: Time from navigation start to full project render (measured in milliseconds)
- **Warm Load Time**: Time to reload the project with cache available
- **Cache Size**: IndexedDB cache size after project load completes (in bytes/KB/MB)
- **Cache Entry Count**: Number of entries stored in IndexedDB
- **Project File Size**: Size of the serialized project file
- **GCode Generation Metrics** (NEW):
  - GCode generation time per atom
  - GCode output size (lines and G/M commands)
  - Number of GCode atoms in the project
  - Visualization performance tracking

The test:
1. Clears the IndexedDB cache before testing to ensure cold load measurement
2. Navigates to each project in `projects_to_test.js`
3. Waits for the project to fully render
4. Measures the total time and cache size
5. Detects and measures GCode generation performance
6. Reloads the project to measure warm load time
7. Outputs results in both human-readable and JSON formats

**Usage:**
```bash
npm run test:metrics
```

**Output:**
- Human-readable summary showing load times and cache sizes
- JSON output for machine consumption and CI/CD integration
- Exit code 0 on success, 1 on error

**GitHub Actions Integration:**
- Runs automatically on every pull request
- Posts metrics as a PR comment with a formatted table
- Metrics are updated on each commit

### projects_to_test.js
Configuration file listing which projects to test. Currently includes:
- Wall-Anchor
- Test-Everything-Fully

## CI/CD Integration

Both tests run automatically in GitHub Actions on pull requests:

1. **Screenshot Tests** (from `index.js`):
   - Takes screenshots of each project
   - Posts screenshots as PR comment
   - Uploads to S3 (if configured)

2. **Metrics Tests** (from `metrics.js`):
   - Measures performance metrics
   - Posts metrics table as PR comment
   - Tracks load time, cache size, and GCode generation trends
   - Compares base branch vs PR branch performance
   - Displays GCode generation metrics when applicable

## Local Development

To run tests locally:

1. Start the development server:
   ```bash
   npm start
   ```

2. In a separate terminal, run tests:
   ```bash
   # Run screenshot tests
   npm test
   
   # Run metrics tests
   npm run test:metrics
   ```

## Future Enhancements

Completed improvements:
1. ✅ Cold load time measurement
2. ✅ Cache size measurement
3. ✅ Warm-load time measurement (reload after cache populated)
4. ✅ GCode generation performance tracking
5. ✅ GCode visualization metrics

Potential future improvements:
1. ⏳ Test multiple projects with different cache profiles
2. ⏳ Regression detection (alert on significant performance degradation)
3. ⏳ Multiple cold load runs with average/statistical analysis
4. ⏳ Memory usage tracking
5. ⏳ 3D rendering performance metrics
