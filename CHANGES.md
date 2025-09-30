# Changes Summary: Exclude "Keep Out" Geometry from Cut Layout

## Issue
When computing a cut layout, geometry tagged as "Keep Out" (color #D9544D) was being included in the layout. This construction-only geometry should not appear in the final cut layout.

## Solution
Modified the cut layout system to automatically filter out "Keep Out" geometry before processing layouts.

## Changes Made

### 1. Modified `src/worker/cutlayout.ts`
- **Added import**: Imported `extractKeepOut` function from `tags.ts`
- **Modified `rotateForLayout` function**: Added filtering logic at the start of the function to exclude keepout geometry before any processing or caching occurs
- The filter is applied early in the pipeline so that:
  - Both `layout()` and `displayLayout()` benefit from the filtering (they both call `rotateForLayout`)
  - The cache system works correctly with filtered geometry
  - An informative error is thrown if all geometry is marked as keepout

### 2. Added `tests/cutlayout-keepout.test.js`
- Comprehensive test suite to verify keepout geometry exclusion
- Tests include:
  - Verification that `extractKeepOut` returns `false` when all geometry has keepout tag
  - Filtering out keepout geometry from mixed assemblies
  - Passing through assemblies with only normal geometry
  - Handling nested assemblies with keepout geometry
  - Verification that #D9544D color automatically adds keepout tag

## Implementation Details

The `extractKeepOut` function (already existing in `src/worker/tags.ts`):
- Recursively walks through assembly structures
- Removes any geometry with the "keepout" tag
- Returns `false` if all geometry in an assembly is marked as keepout
- Is already used by export functions (`visExport`, `downExport`)

By adding the filter in `rotateForLayout`, we ensure that:
1. The filtering happens once, early in the pipeline
2. Both `layout()` and `displayLayout()` automatically benefit
3. The cache system correctly distinguishes between filtered and unfiltered assemblies
4. Users get a clear error message if they try to lay out only keepout geometry

## Testing
- Added 6 new unit tests, all passing
- Verified existing tests continue to pass (169 passing tests)
- Build system validates successfully
- No breaking changes to existing functionality

## Behavior
- Geometry tagged with "keepout" or colored with #D9544D will be automatically excluded from cut layouts
- If all geometry in an assembly is marked as keepout, a clear error message is shown: "No geometry to layout after keepout geometry is excluded"
- Mixed assemblies (with both normal and keepout geometry) will have the keepout geometry silently filtered out
