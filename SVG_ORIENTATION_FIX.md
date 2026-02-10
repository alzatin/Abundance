# SVG Export Orientation Fix

## Problem
SVG exports were created with inverted orientation - text and shapes appeared upside down compared to the 3D model view in the application.

## Root Cause
The `drawProjection()` method from the replicad library creates a 2D projection of 3D geometry using the library's native 3D coordinate system, where the Y-axis points upward (standard CAD convention). However, SVG uses screen coordinates where the Y-axis points downward, causing the exported SVG to appear inverted.

## Solution
Added a 180-degree rotation around the X-axis to flip the projected drawing before converting it to SVG. This transformation corrects the Y-axis orientation mismatch between replicad's 3D coordinate system and SVG's 2D screen coordinates.

## Changes Made

### File: `src/worker/worker.ts`

#### 1. `downExport` function
**Before:**
```typescript
const drawingResult = util.replicad.drawProjection(shape3d, "top").visible;
let svg = drawingResult.clone().scale(scaling).toSVG(scaling);
```

**After:**
```typescript
const drawingResult = util.replicad.drawProjection(shape3d, "top").visible;
// Flip the drawing to correct SVG orientation
let svg = flipDrawingForSvg(drawingResult)
  .scale(scaling)
  .toSVG(scaling);
```

#### 2. `visExport` function
**Before:**
```typescript
const drawingResult = util.replicad
  .drawProjection(shape3d, "top")
  .visible.sketchOnPlane("XY")
  .extrude(0.0001);
```

**After:**
```typescript
const drawing = util.replicad
  .drawProjection(shape3d, "top")
  .visible;
// Flip the drawing to correct SVG orientation
const drawingResult = flipDrawingForSvg(drawing)
  .sketchOnPlane("XY")
  .extrude(0.0001);
```

### Helper Function Added
A new helper function `flipDrawingForSvg()` was created to encapsulate the rotation logic and ensure consistency between both export functions:

```typescript
function flipDrawingForSvg(drawing: Drawing): Drawing {
  const center = drawing.boundingBox.center;
  return drawing
    .clone()
    .rotate(180, [center[0], center[1], 0], new util.replicad.Vector([1, 0, 0]));
}
```

## Technical Details

### Rotation Parameters
- **Angle**: 180 degrees
- **Rotation point**: Center of the drawing's bounding box at Z=0
- **Rotation axis**: X-axis, defined as `Vector([1, 0, 0])`

This rotation effectively flips the drawing upside down around its center, correcting the orientation for SVG export.

### Inspiration
The solution follows the same pattern used in `cutlayout.ts` in the face orientation logic for flipping faces:
```typescript
.rotate(180, pointOnSurface, new util.replicad.Vector([1, 0, 0]))
```

## Testing
- ✅ Build successful: `npm run build` completes without errors
- ✅ Unit tests: 650 tests pass (53 pre-existing failures unrelated to this change)
- ✅ CodeQL security scan: No vulnerabilities found
- ✅ No breaking changes to existing functionality

## Impact
This fix affects all SVG exports from 3D geometry:
- **Export functionality**: Downloads via the Export atom
- **Preview functionality**: Visual preview in the application (via `visExport`)
- **Thumbnail generation**: Uses the same projection system but different camera angle

## Notes
- The fix only applies to 3D geometry being exported as SVG
- 2D geometry exports are unaffected (different code path)
- The rotation is performed on the 2D projection before SVG generation, not on the 3D model itself
- The fix maintains the existing scaling and other transformations
- **Code structure note**: `visExport` creates a thin 3D extrusion (0.0001 units) after rotation for preview purposes, while `downExport` keeps the 2D drawing for direct SVG export. Both use the same `flipDrawingForSvg()` helper to ensure consistent orientation.
