# Range Valuetype Feature - Manual Testing Guide

## Overview
This feature adds a new "range" valuetype to Input atoms in Abundance, allowing users to define numeric ranges with min and max values. When used in a molecule, range inputs are displayed as interactive sliders.

## Changes Made

### 1. Added "range" to Input Type Options
- File: `src/molecules/input.js` (line 940)
- The Input Type selector now includes "range" as an option alongside "number", "string", "geometry", "array", "boolean", and "import"

### 2. Min/Max Parameter Controls
- File: `src/molecules/input.js` (lines 985-1044)
- When an input's type is set to "range", two new number fields appear in the parameter menu:
  - **Min Value**: Sets the minimum value for the range (default: 0)
  - **Max Value**: Sets the maximum value for the range (default: 100)
- Changes to min/max are automatically propagated to the parent attachment point's options

### 3. Range Slider Display
- File: `src/prototypes/atom.js` (lines 1077-1094)
- When a molecule has a range-type input, it displays as a "rangeSlider" control
- File: `src/components/secondary/SimpleControlPanel.jsx` (lines 1107-1170)
- The slider shows:
  - Interactive range slider
  - Current value display
  - Min and max labels at the ends

### 4. Serialization Support
- File: `src/molecules/input.js` (lines 1093-1120)
- Min and max values are saved when projects are serialized
- Projects can be saved and reloaded with range configurations intact

## How to Test

### Step 1: Add an Input Atom
1. Log in to Abundance at http://localhost:4444
2. Create a new project or open an existing one
3. Add an "Input" atom to the canvas

### Step 2: Configure as Range Type
1. Select the Input atom
2. In the Parameters menu (right sidebar), locate the "Input Type" dropdown
3. Select "range" from the options
4. Two new fields will appear:
   - **Min Value**: Enter the minimum value (e.g., 0)
   - **Max Value**: Enter the maximum value (e.g., 100)

### Step 3: Use in a Molecule
1. Create a molecule (or use the top-level molecule)
2. Add a Code atom that uses the range input (e.g., `return myRange * 2`)
3. Click the "Run" button to view the molecule's execution
4. In the Run Parameters panel, you should see:
   - A slider control for the range input
   - The current value displayed above the slider
   - Min and max values displayed at the slider ends
5. Drag the slider to change the value
6. The value updates in real-time as you drag

### Step 4: Verify Serialization
1. Save the project
2. Reload the page
3. Verify that the range input maintains its min/max settings

## Expected Behavior

### Parameter Menu (Input Atom Selected)
```
┌─────────────────────────────────┐
│ Parameters                      │
├─────────────────────────────────┤
│ Input Name:    [myRange      ]  │
│ Input Type:    [range ▼]        │
│ Min Value:     [0            ]  │
│ Max Value:     [100          ]  │
└─────────────────────────────────┘
```

### Run Parameters (Molecule Level)
```
┌─────────────────────────────────┐
│ Run Parameters                  │
├─────────────────────────────────┤
│ myRange:                        │
│ ├──────●─────────────────────┤  │
│ 0             50             100│
└─────────────────────────────────┘
```

## Implementation Details

### Type System
- Added "range" to the valuetype system alongside existing types
- Range inputs are treated as numeric values with constraints
- The valueType is stored in the attachment point for proper handling

### UI Components
- **SimpleControlPanel**: New "rangeSlider" case handles rendering
- **Input molecule**: Creates min/max parameter controls
- **Atom createInputParams**: Generates rangeSlider config for molecule-level inputs

### Data Flow
1. User selects "range" type in Input atom
2. Min/max controls appear and can be configured
3. Values are stored on the Input atom (this.min, this.max)
4. Values propagate to parentAP.options = {min, max}
5. When molecule runs, atom.createInputParams creates rangeSlider control
6. SimpleControlPanel renders the slider with proper constraints

## Test Coverage
- ✅ Range type appears in input type options
- ✅ Min/max controls are created when type is "range"
- ✅ Default min (0) and max (100) are initialized
- ✅ Min/max values are serialized correctly
- ✅ Changes propagate to parent attachment point
- ✅ RangeSlider control is created for molecule inputs

All tests pass (6/6) in `tests/range-valuetype.test.js`
