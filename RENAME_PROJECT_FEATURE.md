# Project Rename Feature

## Overview
This feature allows users to rename their Abundance projects. The rename operation updates both the GitHub repository name and the AWS DynamoDB entry to maintain data consistency.

## User Interface Locations

### 1. Settings Pop-up (Create Mode)
- **Location**: When in a project, click the top menu → Settings
- **Access**: INFO tab → Project Name section
- **UI Element**: Green "Rename" button next to the project name
- **Availability**: Only visible to project owners

### 2. Projects Page (Login Mode)
- **Location**: Projects list page (accessible from homepage)
- **Access**: Right-click on any owned project
- **UI Element**: "Rename" option in the context menu (between "See Repository" and "Delete")
- **Availability**: Only appears for projects owned by the current user

## Implementation Details

### Components Added

#### RenameProjectDialog.jsx
- Reusable dialog component for collecting the new project name
- Validation rules:
  - Cannot be empty
  - No spaces allowed (use hyphens instead)
  - Only alphanumeric characters, dots, underscores, and hyphens
  - Cannot start or end with a hyphen
  - Maximum 100 characters
  - Must be different from current name

#### renameProject Function (ProjectContext.jsx)
Process flow:
1. Validates new name against current name
2. Renames GitHub repository via Octokit API (`repos.update`)
3. Deletes old AWS DynamoDB entry
4. Creates new AWS DynamoDB entry with updated:
   - `repoName`
   - `searchField`
   - `html_url`
   - `readme`
   - `contentURL`
   - `svgURL`
5. Updates global variables
6. Returns updated project data

### GitHub API Integration
- Endpoint: `PATCH /repos/{owner}/{repo}`
- Updates the repository name on GitHub
- Handles errors for duplicate names or invalid names

### AWS DynamoDB Integration
- **Delete Endpoint**: `DELETE /abundance-stage/abundance-projects`
- **Create Endpoint**: `POST /abundance-stage//post-new-project`
- Maintains all existing project metadata (description, topics, stars, etc.)
- Updates URL references to point to the new repository name

### Progress Tracking
- Shows progress bar during rename operation (0-100%)
- Progress stages:
  - 10%: GitHub API call initiated
  - 50%: GitHub repository renamed
  - 70%: Old AWS entry deleted
  - 90%: New AWS entry created
  - 100%: Global variables updated

## User Experience

### Success Flow
1. User clicks "Rename" button or context menu option
2. Dialog appears with current project name pre-filled
3. User enters new name and clicks "Rename"
4. Progress bar shows operation status
5. Alert confirms successful rename
6. Page refreshes/navigates to new URL
7. Project accessible at new GitHub URL

### Error Handling
- **Invalid Name**: Dialog shows validation error message
- **Duplicate Name**: Alert shows "name might already be taken"
- **Missing Data**: Alert shows "Missing required data"
- **Same Name**: Alert shows "New project name is the same as the current name"
- **Network Error**: Alert shows "An error occurred while renaming the project"

## Security & Permissions
- Only project owners can rename their projects
- Ownership verified by comparing `GlobalVariables.currentUser` with `repo.owner.login`
- Rename button/option hidden for non-owners

## Technical Constraints
- Follows GitHub repository naming conventions
- Maintains referential integrity between GitHub and AWS
- Preserves all project metadata and content
- Updates all URL references atomically

## Testing Recommendations
1. Test with valid project names
2. Test with invalid characters
3. Test with duplicate names
4. Test as project owner vs. non-owner
5. Test from both UI entry points (Settings & Projects page)
6. Verify GitHub repository is actually renamed
7. Verify AWS entry is updated correctly
8. Verify project loads correctly after rename

## Files Modified
- `src/components/secondary/RenameProjectDialog.jsx` (new)
- `src/components/secondary/TopMenu.jsx`
- `src/components/secondary/SettingsPopUp.jsx`
- `src/components/main-routes/LoginMode.jsx`
- `src/contexts/ProjectContext.jsx`
