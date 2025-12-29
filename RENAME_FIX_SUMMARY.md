# Fix Summary: Top Molecule Name Not Updating After Project Rename

## Problem
When a user renames a project using the Settings menu, the project name displayed at the top-left of the Create screen (in the molecule breadcrumb path) does not update to reflect the new name. The GitHub repository is renamed correctly, but the UI still shows the old name.

## Root Cause
The issue is in `src/contexts/ProjectContext.jsx` in the `renameProject` function. When renaming a project, the function performs these steps:

1. ✅ Renames the GitHub repository (line 582-593)
2. ✅ Updates AWS DynamoDB entry with new keys (line 598-626)  
3. ✅ Updates the `project.abundance` file on GitHub with the new name (line 636-691)
4. ✅ Updates `GlobalVariables.currentAWSnode` (line 696)
5. ✅ Updates `GlobalVariables.currentRepoName` (line 697)
6. ❌ **MISSING**: Does NOT update `GlobalVariables.topLevelMolecule.name`

The UI in `src/components/main-routes/flowCanvas.jsx` (lines 638-648) builds the breadcrumb path by reading `molecule.name` from the in-memory molecule chain. Since the in-memory name was never updated, it continues to show the old project name.

## Solution
Added 4 lines to update the in-memory molecule name after successfully renaming the project:

```javascript
// Update the in-memory top molecule name to reflect the rename
if (GlobalVariables.topLevelMolecule) {
  GlobalVariables.topLevelMolecule.name = newName;
}
```

This minimal change ensures that:
1. The in-memory molecule name stays in sync with the repository name
2. The UI breadcrumb immediately reflects the new name
3. The name is consistent across all parts of the application

## Files Changed
- `src/contexts/ProjectContext.jsx` - Added 4 lines (lines 698-701)

## Testing
- ✅ Build succeeds without errors
- ✅ 103 existing unit tests pass
- ✅ No breaking changes to existing functionality
- ✅ Fix is minimal and focused on the specific issue

## How to Verify
1. Start the application
2. Login and open a project you own
3. Open Settings menu (gear icon in top menu)
4. Click "Rename Project"
5. Enter a new project name and confirm
6. **Expected Result**: The project name at the top-left should immediately update to show the new name
7. Navigate into a sub-molecule and back - the breadcrumb path should show the new name throughout

## Notes
- The page reload that happens after rename (line 175 in TopMenu.jsx) ensures the project is reloaded from GitHub with the updated name
- However, updating the in-memory name immediately provides better UX and prevents potential issues if the reload is delayed or fails
- The fix is defensive (checks if topLevelMolecule exists before updating)
