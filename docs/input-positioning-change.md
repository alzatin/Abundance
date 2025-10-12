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

Benefits:
- ✅ Predictable, organized layout
- ✅ No overlapping or collision issues
- ✅ No manual repositioning needed
- ✅ Professional, consistent appearance
- ✅ Matches user's workflow expectations

## Technical Details

### Positioning Logic

1. **First Input Atom:**
   - X: `atomSize * 1.65` (left side of canvas)
   - Y: `atomSize * 2` (top of canvas)

2. **Subsequent Input Atoms:**
   - X: `atomSize * 1.65` (same as first, locked to left)
   - Y: `previousLowestInput.y + (atomSize * 2)` (below previous, with spacing)

### Key Changes in Code

The `adjustYForCollision()` method in `src/molecules/input.js` now:
- Always sets x position to left side
- Finds the lowest existing Input (highest y value)
- Positions the new Input below it with consistent spacing

### Responsive Design

The spacing scales with `GlobalVariables.atomSize`:
- Desktop: `atomSize = 1/65` → smaller, tighter spacing
- Mobile: `atomSize = 1/30` → larger, more touch-friendly spacing
