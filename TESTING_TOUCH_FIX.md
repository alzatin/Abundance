# Testing Touch Location Fix After On-Screen Keyboard

## Issue Description
Touch locations on the flow canvas become inaccurate after using the on-screen keyboard to enter information. Touches don't line up with the things being drawn on the canvas.

## Root Cause
When the on-screen keyboard appears on mobile/tablet devices, it can cause:
1. The browser to scroll the page
2. The viewport dimensions to change
3. Touch coordinates (clientX/clientY) remain relative to the viewport, not the canvas element

The original code passed raw viewport coordinates directly to molecule interaction handlers without accounting for the canvas's position on the page.

## Fix Applied
Added a `getCanvasCoordinates()` helper function that:
1. Gets the canvas element's bounding rectangle using `getBoundingClientRect()`
2. Subtracts the canvas's offset (rect.left, rect.top) from viewport coordinates
3. Returns canvas-relative coordinates that accurately map to canvas elements

This fix was applied to all touch/mouse event handlers:
- `mouseMove()` - for drag operations
- `onMouseDown()` - for click/tap detection
- `onDoubleClick()` - for double-tap navigation
- `onMouseUp()` - for release operations

## Manual Testing Steps

### Test on Touch Device (iOS/Android Tablet or Phone)
1. Deploy the application to a test environment
2. Open the application on a touch device (iPad, iPhone, Android tablet, etc.)
3. Create or open a project with several atoms on the canvas
4. Tap on an atom to select it - verify it highlights correctly
5. Open an input field that triggers the on-screen keyboard (e.g., rename an atom, change a parameter)
6. Enter some text using the on-screen keyboard
7. Dismiss the keyboard by tapping outside or pressing "Done"
8. **CRITICAL TEST**: Try to tap on atoms on the canvas again
   - Verify that taps register at the correct location (where you touch)
   - Verify that atoms highlight when tapped
   - Verify that you can drag atoms to new positions
   - Verify that double-taps work to navigate into molecules
9. Try scrolling the page and repeating steps 4-8
10. Test with different screen orientations (portrait and landscape)

### Expected Results
- Touch locations should accurately correspond to visual elements on the canvas
- No offset should exist between where you touch and what gets selected
- All touch interactions should work consistently before and after keyboard usage

### Test on Desktop (Regression Testing)
1. Open the application in a desktop browser (Chrome, Firefox, Safari)
2. Create or open a project with several atoms
3. Click on atoms - verify selection works
4. Drag atoms - verify dragging works
5. Double-click atoms - verify navigation works
6. Verify all mouse interactions work as before

## Code Changes Summary
- **File**: `src/components/main-routes/flowCanvas.jsx`
- **Added**: `getCanvasCoordinates(clientX, clientY)` helper function
- **Modified**: 
  - `mouseMove()` - now uses `getCanvasCoordinates()`
  - `onMouseDown()` - now uses `getCanvasCoordinates()`
  - `onDoubleClick()` - now uses `getCanvasCoordinates()`
  - `onMouseUp()` - now uses `getCanvasCoordinates()`

## Technical Details
The fix uses `Element.getBoundingClientRect()` which returns:
- `left`: Distance from viewport left edge to element left edge
- `top`: Distance from viewport top edge to element top edge
- `width`, `height`: Element dimensions
- Values automatically account for page scroll position and any CSS transforms

By subtracting these offsets, we convert:
```
viewport coordinates → canvas coordinates
clientX - rect.left = canvas X
clientY - rect.top = canvas Y
```

This ensures that regardless of page scroll, keyboard visibility, or viewport changes, touch coordinates accurately map to canvas positions.
