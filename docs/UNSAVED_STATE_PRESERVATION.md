# Unsaved Project State Preservation Feature

## Overview
This feature prevents data loss when users navigate between the project browser and an open project with unsaved changes.

## Problem
Previously, when users had a project open with unsaved changes and navigated to browse other projects (via "Open" or "Browse Projects" buttons), returning to their project would reload it from GitHub, losing all unsaved changes.

## Solution
Implemented localStorage-based state preservation that saves the current project state before navigation and restores it when returning to the project.

## Implementation

### 1. Saving State (Before Navigation)
**Location: TopMenu.jsx - "Open" button**
```javascript
if (GlobalVariables.topLevelMolecule) {
  const projectState = GlobalVariables.topLevelMolecule.serialize();
  projectState.filetypeVersion = 1;
  const projectKey = `unsavedProject_${GlobalVariables.currentAWSnode?.owner}_${GlobalVariables.currentAWSnode?.repoName}`;
  localStorage.setItem(projectKey, JSON.stringify(projectState));
}
```

**Location: ToggleRunCreate.jsx - "Browse Projects" button**
```javascript
if (GlobalVariables.topLevelMolecule && GlobalVariables.currentAWSnode) {
  const projectState = GlobalVariables.topLevelMolecule.serialize();
  projectState.filetypeVersion = 1;
  const projectKey = `unsavedProject_${GlobalVariables.currentAWSnode.owner}_${GlobalVariables.currentAWSnode.repoName}`;
  localStorage.setItem(projectKey, JSON.stringify(projectState));
}
```

**Location: ToggleRunCreate.jsx - Create Mode to Run Mode toggle**
```javascript
const handleCreateToRun = (e) => {
  // Save current project state to localStorage before switching to Run mode
  // This preserves unsaved changes when toggling between Create and Run modes
  if (GlobalVariables.topLevelMolecule && GlobalVariables.currentAWSnode?.owner && GlobalVariables.currentAWSnode?.repoName) {
    const projectState = GlobalVariables.topLevelMolecule.serialize();
    projectState.filetypeVersion = 1;
    const projectKey = `unsavedProject_${GlobalVariables.currentAWSnode.owner}_${GlobalVariables.currentAWSnode.repoName}`;
    localStorage.setItem(projectKey, JSON.stringify(projectState));
  }
  handleChange();
};
```

### 2. Restoring State (On Return)
**Location: flowCanvas.jsx - useEffect on mount**
```javascript
const projectKey = `unsavedProject_${GlobalVariables.currentAWSnode.owner}_${GlobalVariables.currentAWSnode.repoName}`;
const unsavedProject = localStorage.getItem(projectKey);

if (unsavedProject) {
  try {
    let rawFile = JSON.parse(unsavedProject);
    GlobalVariables.resetIdCounter(rawFile);
    GlobalVariables.topLevelMolecule.deserialize(rawFile);
    // Restore active molecule state
    setActiveAtom(GlobalVariables.currentMolecule);
    GlobalVariables.currentMolecule.selected = true;
    GlobalVariables.currentMolecule = GlobalVariables.topLevelMolecule;
    // Clear localStorage after successful restoration
    localStorage.removeItem(projectKey);
    // Load repo metadata (without overwriting molecules)
    loadProjectMetadata();
  } catch (e) {
    console.error("Error restoring unsaved project:", e);
    loadProject(GlobalVariables.currentAWSnode, authorizedUserOcto);
    localStorage.removeItem(projectKey);
  }
}
```

## Key Features

### Unique Storage Keys
Each project has a unique localStorage key format:
```
unsavedProject_{owner}_{repoName}
```
This prevents state collision when switching between multiple projects.

### Error Handling
- Catches errors during deserialization
- Falls back to loading from GitHub on failure
- Clears corrupted data from localStorage

### Non-Interference with Existing Flows
- Does not interfere with reauthentication flow (uses separate key: `pendingProjectSave`)
- Only activates during normal navigation (not during reauthentication)

### Automatic Cleanup
- localStorage entry is automatically removed after successful restoration
- Ensures no stale data accumulates

## User Flow

### Scenario 1: Browsing Projects from Create Mode
1. User has project open with unsaved changes
2. User clicks "Open" in TopMenu
3. Project state is saved to localStorage
4. User browses other projects
5. User clicks "Return to project"
6. Saved state is restored from localStorage
7. User's unsaved changes are preserved

### Scenario 2: Browsing Projects from Run Mode
1. User is viewing their own project in Run Mode
2. User clicks "Browse Projects"
3. Project state is saved to localStorage
4. User browses other projects
5. User navigates back to their project
6. Saved state is restored from localStorage
7. Project state is preserved

### Scenario 3: Toggling Between Create Mode and Run Mode
1. User has project open in Create Mode with unsaved changes
2. User clicks toggle button to switch to Run Mode
3. Project state is saved to localStorage
4. User views project in Run Mode
5. User clicks toggle button to return to Create Mode
6. Saved state is restored from localStorage
7. User's unsaved changes are preserved

## Testing

### Documentation Tests
Location: `tests/unsaved-project-preservation.test.js`

Covers:
- Saving state when clicking "Open" or "Browse Projects"
- Saving state when toggling from Create Mode to Run Mode
- Restoring state when returning to a project
- Error handling for corrupted data
- Unique localStorage keys per project
- Non-interference with reauthentication flow
- State preservation across different navigation paths

### Manual Testing Checklist
- [ ] Create a new project or open existing project
- [ ] Make some changes (add atoms, modify values)
- [ ] Click "Open" button in TopMenu
- [ ] Browse other projects
- [ ] Click "Return to project"
- [ ] Verify changes are still present
- [ ] Repeat with "Browse Projects" button
- [ ] Test toggling Create Mode → Run Mode → Create Mode
- [ ] Verify unsaved changes preserved across mode toggles
- [ ] Test with multiple projects to ensure no collision
- [ ] Test error handling by corrupting localStorage data

## Limitations

1. **Browser Limitations**: 
   - Depends on localStorage availability
   - Subject to browser storage limits (typically 5-10 MB)
   - Cleared if user clears browser data

2. **Scope**:
   - Only preserves state during navigation within the same browser session
   - Does not replace the need for regular saving
   - Not a backup mechanism

3. **Privacy**:
   - Data stored in localStorage is accessible to anyone with access to the browser
   - Not suitable for sensitive project data (but projects are GitHub-backed anyway)

## Future Enhancements

Potential improvements:
1. Add visual indicator when restoring from saved state
2. Prompt user before restoring (in case they want fresh load)
3. Implement expiration for saved states
4. Add compression for large project states
5. Track multiple saved states for history

## Related Files

### Modified Files
- `src/components/secondary/TopMenu.jsx`
- `src/components/secondary/ToggleRunCreate.jsx`
- `src/components/main-routes/flowCanvas.jsx`

### New Files
- `tests/unsaved-project-preservation.test.js`
- `docs/UNSAVED_STATE_PRESERVATION.md` (this file)

## References

- Issue: "Redirect improvement when opening projects"
- PR: Implements localStorage-based state preservation
- Original Problem: Project reload causing data loss on navigation
