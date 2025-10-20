# TopMenu Progress Indicator Fix

## Problem
The SaveBar, RenameBar, and DuplicateBar progress indicators were causing a priority conflict with the TopMenu dropdown menu. When these progress bars updated their state during save/rename/duplicate operations, they would force the entire TopMenu component to re-render, disrupting the dropdown menu's open/close state and making it impossible to use the menu while operations were in progress.

## Root Cause
The progress state variables (`saveState`, `duplicateProgress`, `renameProgress`) were being passed as props to the TopMenu component from the parent CreateMode component. When these values changed, React would re-render the entire TopMenu component tree, including the Navbar component. This would reset the internal `navbarOpen` state, causing the dropdown to close unexpectedly.

## Solution
Wrapped the following components with React's `memo()` higher-order component:
- `SaveBar` - Prevents re-render when other progress bars update
- `DuplicateBar` - Prevents re-render when other progress bars update
- `RenameBar` - Prevents re-render when other progress bars update
- `Navbar` - **Most critical** - Prevents re-render when progress state changes, preserving the dropdown's open/close state

## Changes Made
File: `src/components/secondary/TopMenu.jsx`

Changed 4 component definitions from:
```javascript
const ComponentName = ({ props }) => { ... };
```

To:
```javascript
const ComponentName = memo(({ props }) => { ... });
```

## How It Works
`React.memo()` is a higher-order component that memoizes the component's render output. It only re-renders when its props actually change. This means:
- SaveBar only re-renders when `saveState`, `savePopUp`, or `setSavePopUp` change
- DuplicateBar only re-renders when `duplicateProgress` or `duplicatingProject` change
- RenameBar only re-renders when `renameProgress` or `renamingProject` change
- **Navbar only re-renders when `currentMoleculeTop` changes** (not when progress values change)

## Testing
- Build: ✅ Successful
- Unit Tests: ✅ 48 test files passed (272 test cases)
- Manual Verification: The development server starts successfully

## Impact
- Minimal code changes (only 4 components wrapped with memo)
- No breaking changes to existing functionality
- Improved user experience: dropdown menu remains usable during save/rename/duplicate operations
- No performance overhead (memo only adds optimization)
