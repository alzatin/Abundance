# Duplicate Project Feature

## Overview
This feature adds a "Duplicate Project" button to the top menu dropdown that allows users to create a complete copy of their current project with a single click.

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
4. System shows progress bar (0-100%)
5. System creates new repository with "-copy" suffix
6. System copies all project files
7. System updates AWS database
8. System shows success alert
9. System redirects to the new project

### Smart Naming
- First copy: `project-name-copy`
- If that exists: `project-name-copy-1`
- If that exists: `project-name-copy-2`
- And so on...

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

### Repository Creation Errors
- If the repository name is already taken (shouldn't happen due to smart naming, but still checked)
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

**User sees**: "Cannot duplicate project: No active project or user not authenticated."

## Progress Tracking

The progress bar shows status during the duplication process:

- 0-5%: Initial checks and validation
- 5-10%: Creating new repository
- 10-85%: Copying files (distributed across all 7 files)
- 85-95%: Copying topics and updating metadata
- 95-100%: Updating AWS database and finalizing

## Technical Implementation

### Files Modified
1. `src/contexts/ProjectContext.jsx` - Added `duplicateProject` function (206 lines)
2. `src/components/secondary/TopMenu.jsx` - Added menu item and UI components
3. `public/imgs/Duplicate Project.svg` - Created custom icon

### Key Functions
- `duplicateProject(authorizedUserOcto, setDuplicateProjectBar)` - Main duplication logic
- `handleDuplicateProject()` - Menu item handler
- `DuplicateBar()` - Progress bar component

### Dependencies
- Uses existing Octokit API client
- Integrates with existing AWS backend
- Reuses project creation patterns from `createProject`

## Testing

### Unit Tests
8 comprehensive tests covering:
- Name generation with "-copy" suffix
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
5. Wait for progress bar to complete
6. Verify redirection to new project
7. Check that all files exist in new GitHub repository

## Future Enhancements
Potential improvements for future iterations:
- Option to customize the duplicate name
- Selective file copying (choose which files to include)
- Duplicate with modifications (change license, description, etc.)
- Duplicate from other users' projects (fork-like behavior)
