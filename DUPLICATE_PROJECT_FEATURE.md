# Duplicate Project Feature

## Overview
This feature adds a "Duplicate Project" button to the top menu dropdown that allows users to create a complete copy of their current project. Users can customize the project name before duplication and choose whether to navigate to the new project or stay in the current one.

## Location
The "Duplicate Project" menu item appears in the top menu dropdown, positioned after "Save Project" and before "Re-authenticate".

### Menu Order
1. Open
2. GitHub
3. Read Me
4. Bill of Materials
5. Share
6. Save Project
7. **Duplicate Project** ← NEW
8. Re-authenticate
9. Settings
10. Pull Request
11. ExportGit
12. Delete Project

## How It Works

### User Flow
1. User opens a project in Abundance
2. User clicks the hamburger menu (three lines) in the top left
3. User clicks "Duplicate Project"
4. **Dialog appears asking for the new project name** (defaults to "project-name-copy")
5. User can customize the name or use the default
6. User clicks "Duplicate" to proceed or "Cancel" to abort
7. System shows progress bar (0-100%)
8. System creates new repository with the chosen name
9. System copies all project files
10. System updates AWS database
11. **Completion dialog appears with two options:**
    - "Stay Here" - remains in the current project
    - "Open New Project" - navigates to the duplicated project

### Custom Naming
- Users can provide any valid GitHub repository name
- Default placeholder: `project-name-copy`
- Validation ensures the name:
  - Is not empty
  - Contains no spaces (suggests hyphens instead)
  - Uses only valid characters (letters, numbers, dots, underscores, hyphens)
  - Doesn't start or end with a hyphen
  - Is 100 characters or less
- Real-time validation feedback shows errors before submission

### Files Copied
The following files are duplicated from the original project:
1. `project.abundance` - Main CAD model
2. `BillOfMaterials.md` - Bill of materials
3. `README.md` - Project documentation
4. `project.svg` - Project image
5. `.gitattributes` - Git configuration
6. `data.json` - Project data
7. `LICENSE.txt` - Project license

### Additional Data Preserved
- Project description
- Project topics/tags
- Project metadata

## Error Handling

The feature includes comprehensive error handling:

### Name Validation Errors
- Empty project name
- Names containing spaces
- Invalid characters
- Names starting/ending with hyphens
- Names exceeding 100 characters

**User sees**: Real-time validation messages in the dialog

### Repository Creation Errors
- If the repository name is already taken
- If GitHub API is unavailable
- If user lacks permissions

**User sees**: "Error creating duplicate project. Please try again."

### File Copy Errors
- If individual files fail to copy, the process continues with other files
- Errors are logged to console for debugging

### General Errors
- Network failures
- Authentication issues
- Missing project data

**User sees**: "An error occurred while duplicating the project. Please try again."

### Validation Errors
- No active project
- User not authenticated

**User sees**: "Cannot duplicate project: No active project or user not authenticated." or "You must be authenticated to duplicate a project."

## Progress Tracking

The progress bar shows status during the duplication process:

- 0-5%: Initial checks and validation
- 5-10%: Creating new repository
- 10-85%: Copying files (distributed across all 7 files)
- 85-95%: Copying topics and updating metadata
- 95-100%: Updating AWS database and finalizing

## Technical Implementation

### Files Modified/Created
1. `src/contexts/ProjectContext.jsx` - Updated `duplicateProject` function (accepts custom name)
2. `src/components/secondary/TopMenu.jsx` - Added dialogs and updated handlers
3. `src/components/secondary/DuplicateProjectDialog.jsx` - New naming dialog component
4. `src/components/secondary/DuplicateCompleteDialog.jsx` - New completion dialog component
5. `public/imgs/Duplicate Project.svg` - Custom icon

### Key Components

#### DuplicateProjectDialog
- Accepts user input for project name
- Validates name in real-time
- Shows validation errors
- Defaults to "project-name-copy"
- Supports Enter to confirm, Escape to cancel

#### DuplicateCompleteDialog
- Shows success message with new project name
- Offers two options:
  - "Stay Here" - closes dialog, stays in current project
  - "Open New Project" - navigates to duplicated project and reloads

### Key Functions
- `duplicateProject(authorizedUserOcto, setDuplicateProjectBar, customName)` - Main duplication logic with optional custom name
- `handleDuplicateProject()` - Shows naming dialog
- `executeDuplication(customName)` - Executes duplication with user-provided name
- `DuplicateBar()` - Progress bar component

### Dependencies
- Uses existing Octokit API client
- Integrates with existing AWS backend
- Reuses project creation patterns from `createProject`
- Uses existing dialog styling patterns

## Testing

### Unit Tests
9 comprehensive tests covering:
- Name generation with "-copy" suffix
- Custom name usage
- Name incrementing when duplicates exist
- All required files are included
- Error handling scenarios
- Progress bar validation
- Project body formatting
- Missing repo/user handling

All tests pass successfully.

### Manual Testing
To manually test:
1. Start development server: `npm start`
2. Log in to Abundance
3. Open any existing project
4. Click hamburger menu → "Duplicate Project"
5. Verify naming dialog appears with default name
6. Try different names (valid and invalid)
7. Confirm duplication
8. Wait for progress bar to complete
9. Verify completion dialog appears
10. Test both "Stay Here" and "Open New Project" options
11. Check that all files exist in new GitHub repository

## Future Enhancements
Potential improvements for future iterations:
- Remember user's last choice (stay vs navigate)
- Option to customize which files to copy
- Duplicate with modifications (change license, description, etc.)
- Duplicate from other users' projects (fork-like behavior)
- Batch duplication of multiple projects
- Preview of what will be copied before duplication
