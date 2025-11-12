# Fix: Readme SVG Not Being Assigned to Project

## Issue
When a project has no output or the output can't be computed (e.g., Scale or Linear Pattern molecules without required inputs), the readme SVG thumbnail was not being used as the project thumbnail.

## Root Cause
The `meshArrayToSVG2` function in `ReplicadMesh.jsx` returns an empty SVG string when there are no points to render:
```javascript
if (allProjectedPoints.length === 0) {
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"></svg>`;
}
```

This empty SVG string is **truthy** in JavaScript, so the fallback logic `finalSVG || backupProjectSVG` would use the empty SVG instead of falling back to the readme SVG.

## Solution
Added validation to check if an SVG actually contains content before using it as the project thumbnail.

### Changes Made

#### 1. Added `isValidSVG()` Helper Function
Location: `src/components/main-routes/CreateMode.jsx` (line 883-891)

```javascript
const isValidSVG = (svg) => {
  if (!svg) return false;
  // Check if SVG is empty (has no paths or other content between svg tags)
  const hasContent = svg.includes('<path') || svg.includes('<circle') || 
                    svg.includes('<rect') || svg.includes('<line') ||
                    svg.includes('<polygon') || svg.includes('<polyline');
  return hasContent;
};
```

This function checks if an SVG contains actual drawable content by looking for common SVG elements.

#### 2. Updated Thumbnail Selection Logic
Location: `src/components/main-routes/CreateMode.jsx` (line 895-897)

**Before:**
```javascript
const thumbnailToUse = finalSVG || backupProjectSVG;
```

**After:**
```javascript
const thumbnailToUse = (finalSVG && isValidSVG(finalSVG)) ? finalSVG : 
                       (backupProjectSVG && isValidSVG(backupProjectSVG)) ? backupProjectSVG : 
                       null;
```

This ensures:
- If `finalSVG` is valid and has content: use it
- Otherwise, if `backupProjectSVG` is valid and has content: use it
- Otherwise, don't update `project.svg` (preserves existing thumbnail in repo)

#### 3. Added Comprehensive Tests
Location: `tests/readme-svg-fallback.test.js`

Created 15 tests covering:
- Empty SVG detection
- Valid SVG detection (with various elements)
- Null/undefined handling
- Thumbnail selection priority logic
- Fallback behavior

All tests pass ✓

## Expected Behavior

### Scenario 1: Main Output Has Content
- **finalSVG**: `<svg>...<path>...</svg>` (valid)
- **backupProjectSVG**: `<svg>...<circle>...</svg>` (valid)
- **Result**: Uses `finalSVG` ✓

### Scenario 2: Main Output Empty, Readme Has Content
- **finalSVG**: `<svg></svg>` (empty)
- **backupProjectSVG**: `<svg>...<circle>...</svg>` (valid)
- **Result**: Uses `backupProjectSVG` ✓ **[THIS WAS THE BUG]**

### Scenario 3: Main Output Empty, No Readme SVG
- **finalSVG**: `<svg></svg>` (empty)
- **backupProjectSVG**: `null`
- **Result**: Doesn't update `project.svg` ✓

### Scenario 4: No Main Output (Auto Save), Readme Has Content
- **finalSVG**: `undefined` (not generated during auto save)
- **backupProjectSVG**: `<svg>...<path>...</svg>` (valid)
- **Result**: Uses `backupProjectSVG` ✓

## Testing

### Unit Tests
```bash
npm run unit -- tests/readme-svg-fallback.test.js
```

All 15 tests pass.

### Manual Testing
To manually test this fix:

1. Create a project with a Scale or Linear Pattern molecule that has no input
2. Add a Readme atom with geometry input connected to it
3. Save the project (not auto-save)
4. Verify that `project.svg` in the repository contains the readme thumbnail, not an empty SVG

## Files Modified
- `src/components/main-routes/CreateMode.jsx`: Added SVG validation logic (20 lines)
- `tests/readme-svg-fallback.test.js`: New test file (141 lines)

## Impact
- **No breaking changes**: The fix only affects thumbnail selection logic
- **Backward compatible**: Existing projects are not affected
- **Performance**: Minimal impact (simple string checks)
- **Security**: No security implications (CodeQL check passed)
