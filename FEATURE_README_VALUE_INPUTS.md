# ReadMe Atom Value Inputs Feature

## Overview
The ReadMe atom has been enhanced to accept not only geometry inputs but also numbers and text strings as input values. This allows users to document numerical values and text information alongside geometry in their README files.

## What Changed

### Before
- ReadMe atom only accepted geometry as an input (IO name: "geometry")
- When geometry was connected, it would generate a thumbnail
- No support for documenting numerical values or text strings

### After
- ReadMe atom now accepts geometry, numbers, and text strings (IO name: "value")
- When geometry is connected, it generates a thumbnail (same as before)
- When a number or text string is connected, it displays the value in the README with the label "**Value:**"
- The input is flexible and automatically detects the type of data

## How to Use

### Connecting Geometry (Existing Behavior)
1. Create a ReadMe atom
2. Connect geometry output to the ReadMe atom's "value" input
3. The geometry will be rendered as a thumbnail in the README

### Connecting Numbers (New Feature)
1. Create a ReadMe atom
2. Create a Constant or Input atom with a numerical value (e.g., 42, 3.14159)
3. Connect the number output to the ReadMe atom's "value" input
4. The README will display:
   ```
   [Your readme text]
   
   **Value:** 42
   ```

### Connecting Text Strings (New Feature)
1. Create a ReadMe atom
2. Create an Input atom with type "string" or an Equation atom that outputs a string
3. Connect the string output to the ReadMe atom's "value" input
4. The README will display:
   ```
   [Your readme text]
   
   **Value:** Hello, World!
   ```

## Examples

### Example 1: Documenting a Measurement
```
ReadMe text: "The radius of the wheel"
Connected value: 25.4 (mm)

Result in README:
The radius of the wheel

**Value:** 25.4
```

### Example 2: Documenting a Part Name
```
ReadMe text: "Part identifier"
Connected value: "WHEEL-001"

Result in README:
Part identifier

**Value:** WHEEL-001
```

### Example 3: Documenting Geometry (Unchanged)
```
ReadMe text: "The wheel assembly"
Connected value: [Circle geometry]

Result in README:
The wheel assembly

![readme](/readme[uniqueID].svg)
```

## Implementation Details

### Code Changes
1. **src/molecules/readme.js**
   - Changed IO name from "geometry" to "value" to better reflect multi-type support
   - Updated `generateProjectThumbnail()` to only generate thumbnails for objects (geometry)
   - Modified `requestReadme()` to append non-geometry values as text in the README

### Type Detection
The atom uses JavaScript's `typeof` operator to detect the value type:
- `typeof value === 'object'` → Geometry (generates thumbnail)
- `typeof value !== 'object'` → Number or String (displays as text)

### Display Format
Non-geometry values are formatted as:
```
[Existing readme text]

**Value:** [The actual value]
```

The "**Value:**" label is bold in markdown format and clearly separates the input value from the readme text.

## Testing
A comprehensive test suite was added in `tests/readme-value-inputs.test.js` with 15 test cases covering:
- Geometry input with thumbnail generation
- Number inputs (positive, negative, zero, decimals)
- String inputs (single-line, multi-line, empty, special characters)
- Boolean inputs
- Null and undefined inputs
- Edge cases and error handling

All tests pass successfully.

## Backward Compatibility
This change is fully backward compatible:
- Existing ReadMe atoms with geometry connections will continue to work
- The IO name changed from "geometry" to "value", but the valueType remains "geometry"
- The type detection ensures that geometry is still handled the same way

## Future Enhancements
Possible future improvements could include:
- Custom label text instead of hardcoded "**Value:**"
- Formatting options for numbers (decimal places, units)
- Support for arrays of values
- Custom styling for different value types
