# Input Atom Name Visibility Improvements

## Issues Fixed

This PR resolves the following issues with input atom name visibility:

### Issue 1: Text Size Inconsistency
**Problem**: Text appeared "extremely large" when not hovering over inputs
**Root Cause**: Code used `GlobalVariables.fontSize` which doesn't exist
**Solution**: Changed to `GlobalVariables.canvasFont` (the correct property)

### Issue 2: Poor Text Space Utilization  
**Problem**: Names with 5-6+ characters were truncated with ellipsis even though the atom width wasn't fully utilized
**Root Cause**: Text overflow was calculated using hardcoded 50px max width, regardless of actual atom width
**Solution**: Use actual atom width minus padding (`this.width - 10`) for truncation calculation

### Issue 3: Fixed Width Atoms
**Problem**: All input atoms had the same width regardless of name length, making longer names harder to read
**Root Cause**: Width was fixed at `radiusInPixels * 2.5`
**Solution**: Implement dynamic width based on text measurement with min/max constraints

## Technical Changes

### File Modified: `src/molecules/input.js`

#### Change 1: Font Setting (Lines 331, 369)
```javascript
// BEFORE
GlobalVariables.c.font = GlobalVariables.fontSize; // ❌ fontSize doesn't exist

// AFTER  
GlobalVariables.c.font = GlobalVariables.canvasFont; // ✅ Uses correct property
```

#### Change 2: Dynamic Width Calculation (Lines 329-336)
```javascript
// BEFORE
this.width = radiusInPixels * 2.5; // ❌ Fixed width

// AFTER
// Set font first to measure text accurately
GlobalVariables.c.font = GlobalVariables.canvasFont;
const textWidth = GlobalVariables.c.measureText(this.name).width;
const padding = 15; // Left padding (5) + right padding (10)
const minWidth = radiusInPixels * 2.5; // Minimum width based on original design
const maxWidth = radiusInPixels * 6; // Maximum width to prevent overly wide atoms
this.width = Math.max(minWidth, Math.min(maxWidth, textWidth + padding)); // ✅ Dynamic width
```

**Width Behavior:**
- **Short names** (e.g., "x", "y"): Use minimum width (maintains original design)
- **Medium names** (e.g., "height", "radius"): Width expands to fit text + padding
- **Long names** (e.g., "veryLongParameterName"): Width capped at maximum, text truncates with ellipsis

#### Change 3: Text Overflow Calculation (Lines 376-378)
```javascript
// BEFORE
GlobalVariables.c.fillText(
  this.fittingString(GlobalVariables.c, this.name, 50), // ❌ Hardcoded 50px
  5,
  yInPixels + 3
);

// AFTER
const maxTextWidth = this.width - 10; // Leave 5px on each side
GlobalVariables.c.fillText(
  this.fittingString(GlobalVariables.c, this.name, maxTextWidth), // ✅ Uses actual width
  5,
  yInPixels + 3
);
```

## Width Calculation Examples

Given `atomSize = 1/65` (desktop default) and `radiusInPixels ≈ 20`:

| Name Length | Text Width | Calculated Width | Final Width | Behavior |
|-------------|------------|------------------|-------------|----------|
| 3 chars ("xyz") | ~24px | 24+15=39px | 50px (min) | Uses minimum width |
| 8 chars ("diameter") | ~64px | 64+15=79px | 79px | Fits perfectly |
| 15 chars ("inputParameter") | ~120px | 120+15=135px | 135px | Expands to fit |
| 30 chars ("veryLongInputName...") | ~240px | 240+15=255px | 120px (max) | Capped at maximum, truncates |

Where:
- Minimum width = `radiusInPixels * 2.5` ≈ 50px
- Maximum width = `radiusInPixels * 6` ≈ 120px
- Padding = 15px (5px left + 10px right)

## Testing

Created comprehensive unit tests in `tests/input-text-rendering.test.js`:

### Width Calculation Tests (5 tests)
- ✅ Returns minimum width for very short names
- ✅ Expands width for medium-length names  
- ✅ Caps width at maximum for very long names
- ✅ Scales properly with different atom sizes (mobile vs desktop)
- ✅ Adds padding to text width correctly

### Text Truncation Tests (4 tests)
- ✅ Does not truncate text that fits within maxWidth
- ✅ Truncates text that exceeds maxWidth with ellipsis
- ✅ Uses actual atom width for truncation calculation
- ✅ Handles empty strings gracefully

**All 9 tests pass** ✅

## Backwards Compatibility

- Minimum width preserved at original value (`radiusInPixels * 2.5`)
- Short names continue to render exactly as before
- No changes to atom positioning, colors, or other visual properties
- Existing projects will see improved readability without breaking changes

## Benefits

1. **Consistent Text Size**: Text is always rendered at the user's configured font size, no more oversized text
2. **Better Readability**: Longer names get more space, making them easier to read
3. **Efficient Space Usage**: Text now fills the entire atom width before truncating
4. **Controlled Growth**: Maximum width prevents atoms from becoming too wide
5. **Responsive Design**: Width adapts to both text length and atom size (mobile/desktop)
