# TopMenu Progress Indicator Fix

## Problem
The SaveBar, RenameBar, and DuplicateBar progress indicators were causing a priority conflict with the TopMenu dropdown menu. When these progress bars updated their state during save/rename/duplicate operations, they would force the entire TopMenu component to re-render, disrupting the dropdown menu's open/close state and making it impossible to use the menu while operations were in progress.

## Root Cause (Updated)
The progress state variables (`saveState`, `duplicateProgress`, `renameProgress`) were being passed as props to the TopMenu component from the parent CreateMode component. When these values changed, React would re-render the entire TopMenu component tree, including the Navbar component. This would reset the internal `navbarOpen` state, causing the dropdown to close unexpectedly.

**Initial Fix Limitation**: While wrapping components with `memo()` helped, it was insufficient because the Navbar component accessed `navItems` from closure scope. Even though Navbar was memoized, the `navItems` array was recreated on every TopMenu render due to its closure over state/props, causing the Navbar to implicitly depend on parent renders and defeating the memo optimization.

## Solution
Two-part solution required:

### Part 1: Component Memoization
Wrapped the following components with React's `memo()` higher-order component:
- `SaveBar` - Prevents re-render when other progress bars update
- `DuplicateBar` - Prevents re-render when other progress bars update
- `RenameBar` - Prevents re-render when other progress bars update
- `Navbar` - **Most critical** - Prevents re-render when progress state changes, preserving the dropdown's open/close state

### Part 2: Data Memoization (Critical Fix)
Wrapped the `navItems` array with `useMemo()` to prevent it from being recreated on every render:

```javascript
const navItems = useMemo(() => [
  // ... nav items
], [navigate, setDialog, setShareDialog, setSavePopUp, saveProject, 
    setSaveState, handleDuplicateProject, authRedirectHandler, 
    setSettingsPopUp, setExportPopUp]);
```

## Changes Made
File: `src/components/secondary/TopMenu.jsx`

### Initial Changes
Changed 4 component definitions from:
```javascript
const ComponentName = ({ props }) => { ... };
```

To:
```javascript
const ComponentName = memo(({ props }) => { ... });
```

### Additional Required Changes
1. Added `useMemo` to imports
2. Wrapped `navItems` array with `useMemo()` and specified stable dependencies

## How It Works
The complete solution works by:
1. `React.memo()` on components provides shallow prop comparison
2. `useMemo()` on `navItems` ensures stable reference when progress changes
3. Combined effect: Navbar no longer re-renders on progress updates

Specifically:
- SaveBar only re-renders when `saveState`, `savePopUp`, or `setSavePopUp` change
- DuplicateBar only re-renders when `duplicateProgress` or `duplicatingProject` change
- RenameBar only re-renders when `renameProgress` or `renamingProject` change
- **Navbar only re-renders when `currentMoleculeTop` changes** (not when progress values change)
- **navItems only recreates when its dependencies change** (not on every render)

## Testing
- Build: ✅ Successful
- Unit Tests: ✅ 48 test files passed (272 test cases)
- Manual Verification: The development server starts successfully
- User Verification: Confirmed dropdown remains open during progress updates

## Impact
- Minimal code changes (4 components wrapped with memo, 1 array wrapped with useMemo)
- No breaking changes to existing functionality
- Improved user experience: dropdown menu remains usable during save/rename/duplicate operations
- No performance overhead (memo and useMemo only add optimizations)

## Lessons Learned
Memoizing components with `React.memo()` alone is insufficient when those components access data from closure scope. Both the component AND the data it accesses must be properly memoized to achieve complete isolation from parent re-renders.
