# Code Atom Input Value Propagation Fix

## Problem Statement
When an Input atom's output is connected to a Code atom's input, and the Input atom's value is updated, the value was not being reflected in the Code atom's input values.

## Root Cause Analysis

### Subscription Chain in Abundance
The application uses a subscription-based architecture for propagating changes between atoms:

1. **Code Atom subscribes to its Input Attachment Points**: When a Code atom is created, it calls `_subscribeToInputs()` which subscribes the Code atom to each of its input attachment points.

2. **Input Attachment Point subscribes to Upstream Atom**: When a connector links an upstream atom's output to a Code atom's input, the Code atom's input attachment point subscribes to the upstream atom (NOT the upstream's output attachment point).

3. **Value Propagation**: When the upstream atom (e.g., Input atom) changes value:
   - It calls `setReady(value)` on itself
   - This triggers `propagateChange()` which notifies all subscribers
   - The Code atom's input attachment point receives the notification
   - The input attachment point's `onUpstreamChange()` is called
   - The attachment point updates its value and calls `setStatus()`
   - This propagates to the Code atom (which subscribed to the attachment point)
   - The Code atom's `onUpstreamChange()` is called
   - The Code atom recomputes with the new input values

### The Bug
The issue was in the `updateCode()` method:

```javascript
// BEFORE (buggy):
updateCode(code) {
  this.code = code;
  this.parseInputs();        // May create new input attachment points
  this.onUpstreamChange();
  this.sendToRender();
}
```

When `parseInputs()` is called, it may create new input attachment points if the code defines new inputs. However, `updateCode()` was not calling `_subscribeToInputs()` afterwards, so:
- The Code atom would NOT be subscribed to these new input attachment points
- When upstream atoms changed values, the new inputs would update but wouldn't notify the Code atom
- The Code atom would not recompute

### The Fix
```javascript
// AFTER (fixed):
updateCode(code) {
  this.code = code;
  this.parseInputs();
  this._subscribeToInputs();  // Re-establish subscriptions
  this.onUpstreamChange();
  this.sendToRender();
}
```

Adding `_subscribeToInputs()` ensures:
- All input attachment points (including newly created ones) have the Code atom subscribed to them
- The subscription system safely handles duplicate subscriptions (replaces them with the same ID)
- Changes to any input will properly propagate to the Code atom

## Files Changed
- `src/molecules/code.js`: Added `this._subscribeToInputs()` call in `updateCode()` method

## Testing
- All existing unit tests pass
- Build completes successfully
- No regressions introduced
