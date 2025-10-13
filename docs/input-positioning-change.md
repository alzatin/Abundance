# Input Atom Positioning - Behavior Change

## Before (Old Behavior)

Input atoms spawned where the user clicked, leading to scattered and overlapping positions:

```
Canvas:
┌─────────────────────────────────────┐
│                                     │
│        [Input 2]                    │
│                                     │
│                  [Input 3]          │
│                                     │
│    [Input 1]                        │
│           [Input 4]                 │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

Problems:
- ❌ Inputs could overlap or be very close together
- ❌ Users had to manually reposition after each creation
- ❌ No consistent layout or organization
- ❌ Time-consuming to arrange properly

## After (New Behavior)

Input atoms automatically stack vertically on the left side:

```
Canvas:
┌─────────────────────────────────────┐
│ [Input 1]                           │
│                                     │
│ [Input 2]                           │
│                                     │
│ [Input 3]                           │
│                                     │
│ [Input 4]                           │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

With many inputs (dynamic spacing):

```
Canvas (30+ inputs):
┌─────────────────────────────────────┐
│ [Input 1]                           │
│ [Input 2]                           │
│ [Input 3]                           │
│ [Input 4]                           │
│ [Input 5]                           │
│   ...                               │
│ [Input 28]                          │
│ [Input 29]                          │
│ [Input 30]                          │
└─────────────────────────────────────┘
```

Benefits:
- ✅ Predictable, organized layout
- ✅ No overlapping or collision issues
- ✅ No manual repositioning needed
- ✅ Professional, consistent appearance
- ✅ Matches user's workflow expectations
- ✅ **Dynamically adjusts spacing to fit all inputs on screen**

## Technical Details

### Positioning Logic

1. **First Input Atom:**
   - X: `atomSize * 1.65` (left side of canvas)
   - Y: `atomSize * 10` (top of canvas with some margin)

2. **Subsequent Input Atoms:**
   - X: `atomSize * 1.65` (same as first, locked to left)
   - Y: `previousLowestInput.y + spacing` (below previous, with dynamic spacing)

3. **Dynamic Spacing (NEW):**
   - Default spacing: `atomSize * 5`
   - When inputs would exceed canvas height (maxY = 0.95):
     - Spacing is automatically reduced to fit all inputs
     - Minimum spacing: `atomSize * 1.5` (maintains usability)
     - If minimum spacing isn't enough, start position is adjusted higher
   - All inputs stay within canvas bounds

### Key Changes in Code

The `adjustYForCollision()` method in `src/molecules/input.js` now:
- Always sets x position to left side
- Finds the lowest existing Input (highest y value)
- **Calculates total number of inputs and required height**
- **Dynamically adjusts spacing if inputs would exceed canvas height (0.95)**
- **Maintains minimum spacing for usability (atomSize * 1.5)**
- **Adjusts start position if needed to fit more inputs**
- Ensures no input is positioned beyond the canvas height

### Spacing Calculation

```javascript
// Calculate if inputs exceed canvas height
const requiredHeight = startY + (totalInputs - 1) * defaultSpacing;

if (requiredHeight > maxY) {
  // Reduce spacing proportionally
  const availableHeight = maxY - startY;
  spacing = availableHeight / (totalInputs - 1);
  
  // Enforce minimum spacing
  if (spacing < minSpacing) {
    spacing = minSpacing;
    // Adjust start position to fit more
    startY = Math.max(atomSize * 2, maxY - (totalInputs - 1) * spacing);
  }
}
```

### Responsive Design

The spacing scales with `GlobalVariables.atomSize`:
- Desktop: `atomSize = 1/65` → smaller, tighter spacing
- Mobile: `atomSize = 1/30` → larger, more touch-friendly spacing

Both scale proportionally when many inputs are present.
