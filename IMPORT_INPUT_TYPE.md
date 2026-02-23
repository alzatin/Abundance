# Import Input Type Feature

## Overview
The import input type allows Input atoms to accept file uploads (SVG, STL, STEP) and process them into geometry, similar to the Import atom but as an input type.

## Usage

1. **Create an Input atom** in your molecule
2. **Set the Input Type** to "import" in the properties panel
3. **Select File Type** (SVG, STL, or STEP)
4. **Click "Load File"** to upload a file
5. The file will be processed into geometry and made available to the parent molecule

## File Types Supported
- **SVG**: Vector graphics (with adjustable width)
- **STL**: 3D mesh format
- **STEP**: CAD exchange format

## Features
- Files are uploaded to the project's GitHub repository
- Files are automatically loaded when the project is reopened
- SVG files support a width parameter for scaling
- Files are automatically deleted when the Input atom is deleted
- The import input outputs geometry type (can be connected to geometry inputs)

## Technical Details
- Import type inputs have an output `valueType` of "geometry"
- File data is stored with properties: `fileName`, `fileType`, `repoOwner`, `repoName`, `SVGwidth`
- Files are processed using the same CAD functions as the Import atom:
  - `GlobalVariables.cad.importingSVG`
  - `GlobalVariables.cad.importingSTL`
  - `GlobalVariables.cad.importingSTEP`

## Example Use Case
Create a parametric design that accepts an imported logo or component as an input, allowing users to upload their own files when using your molecule in their projects.
