# Project Rename Feature - UI Locations

## 1. Settings Popup (INFO Tab)

When editing a project, users can access the rename function via:
```
Top Menu → Settings → INFO tab
```

```
┌─────────────────────────────────────────────────┐
│ Settings                                     × │
├─────────────────────────────────────────────────┤
│ [INFO] [CANVAS] [PROJECT] [RENDER]              │
├─────────────────────────────────────────────────┤
│                                                  │
│ Project Name                                    │
│ my-project-name  [Rename]  ← GREEN BUTTON       │
│                                                  │
│ Date Created                                    │
│ Mon Jan 01 2024                                 │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Notes:**
- Rename button only visible to project owners
- Click opens RenameProjectDialog

## 2. Projects Page (Right-Click Menu)

On the projects list page, users can right-click on owned projects:

```
┌─────────────────────────────────────────┐
│  MY PROJECTS                            │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────┐  ┌──────────┐            │
│  │ Project1 │  │ Project2 │            │
│  │  [img]   │  │  [img]   │            │
│  │   ⭐ 5   │  │   ⭐ 3   │            │
│  └──────────┘  └──────────┘            │
│       │                                 │
│       └─[Right Click]                   │
│              │                          │
│              ▼                          │
│         ┌──────────────┐                │
│         │ See Repository│               │
│         ├──────────────┤                │
│         │ Rename       │ ← NEW OPTION  │
│         ├──────────────┤                │
│         │ Delete       │                │
│         └──────────────┘                │
│                                          │
└─────────────────────────────────────────┘
```

**Notes:**
- "Rename" option only appears for projects owned by current user
- Other users' projects show only "See Repository"

## 3. Rename Dialog

When user clicks "Rename" from either location:

```
┌─────────────────────────────────────────┐
│ Rename Project                       × │
├─────────────────────────────────────────┤
│                                          │
│ New project name:                       │
│ ┌────────────────────────────────────┐ │
│ │ my-new-project-name                │ │
│ └────────────────────────────────────┘ │
│                                          │
│ [validation error appears here if any] │
│                                          │
│              [Cancel]  [Rename]          │
│                                          │
└─────────────────────────────────────────┘
```

**Validation Rules:**
- No spaces (use hyphens)
- Only alphanumeric, dots, underscores, hyphens
- Cannot start/end with hyphen
- Max 100 characters
- Must be different from current name

## 4. Progress Bar

During rename operation:

```
┌─────────────────────────────────────────┐
│ ████████████████░░░░░░░░░░░░░░░  70%   │
└─────────────────────────────────────────┘
```

Progress stages:
- 10%: GitHub API initiated
- 50%: GitHub repository renamed
- 70%: Old AWS entry deleted
- 90%: New AWS entry created
- 100%: "Project Renamed!" → redirect

## User Flow Diagram

```
┌─────────────┐
│ User clicks │
│   Rename    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Dialog    │
│   Opens     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Enter new   │
│    name     │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────┐
│ Validation  │────→│  Error   │
│   Passes?   │  NO │ Message  │
└──────┬──────┘     └──────────┘
       │ YES
       ▼
┌─────────────┐
│  Progress   │
│     Bar     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  GitHub     │
│  Renamed    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    AWS      │
│  Updated    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Success!   │
│  Redirect   │
└─────────────┘
```
