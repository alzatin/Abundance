# Range Valuetype - Visual UI Guide

## Feature Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STEP 1: Add Input Atom                      │
└─────────────────────────────────────────────────────────────────────┘

Canvas View:
┌───────────────────────────────┐
│                               │
│     ●────────────────○        │  User adds an Input atom
│   Input              Code     │
│                               │
└───────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│              STEP 2: Configure as Range Type (Parameter Menu)       │
└─────────────────────────────────────────────────────────────────────┘

When Input atom is selected:

┌──────────────────────────────────┐
│ ⚙️  Parameters                   │
├──────────────────────────────────┤
│ Input Name:                      │
│ ┌──────────────────────────────┐ │
│ │ height                       │ │
│ └──────────────────────────────┘ │
│                                  │
│ Input Type:                      │
│ ┌──────────────────────────────┐ │
│ │ range                    ▼  │ │  ← User selects "range"
│ └──────────────────────────────┘ │
│   Options: number, string,       │
│           geometry, array,       │
│           boolean, range, import │
│                                  │
│ Min Value:                       │  ← NEW: Min value field appears
│ ┌──────────────────────────────┐ │
│ │ 0                            │ │
│ └──────────────────────────────┘ │
│                                  │
│ Max Value:                       │  ← NEW: Max value field appears
│ ┌──────────────────────────────┐ │
│ │ 100                          │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│           STEP 3: Use in Molecule (Run Parameters View)             │
└─────────────────────────────────────────────────────────────────────┘

When molecule is run (shows inputs at molecule level):

┌──────────────────────────────────┐
│ ▶️  Run Parameters                │
├──────────────────────────────────┤
│                                  │
│ Description:                     │
│   My Test Molecule               │
│                                  │
│ height:                          │  ← Range input displays as slider
│ ┌──────────────────────────────┐ │
│ │ ├─────────●──────────────┤  │ │  ← Interactive slider
│ │ 0          50           100  │ │
│ └──────────────────────────────┘ │
│                                  │
│ [See Project Readme]             │
│ [See Bill of Materials]          │
└──────────────────────────────────┘

Slider Behavior:
- Drag the ● handle to adjust value
- Min (0) and Max (100) shown at ends
- Current value (50) displayed in center
- Updates in real-time as you drag
- Value is constrained between min and max
```

## Key UI Elements

### 1. Parameter Menu (Input Configuration)
```
BEFORE selecting "range":
┌─────────────────────────┐
│ Input Name: [myInput  ] │
│ Input Type: [number ▼ ] │
└─────────────────────────┘

AFTER selecting "range":
┌─────────────────────────┐
│ Input Name: [myInput  ] │
│ Input Type: [range  ▼ ] │
│ Min Value:  [0        ] │  ← NEW
│ Max Value:  [100      ] │  ← NEW
└─────────────────────────┘
```

### 2. Range Slider Component (Molecule Level)
```
┌────────────────────────────────┐
│ inputName:                     │
│ ├────────●─────────────────┤  │
│ min      value          max   │
└────────────────────────────────┘

Features:
- HTML5 range input (native slider)
- Smooth dragging interaction
- Touch-friendly (mobile support)
- Real-time value updates
- Visual feedback with accent color
```

## Data Flow

```
┌─────────────────┐
│  Input Atom     │
│  (type="range") │
│  min: 0         │
│  max: 100       │
└────────┬────────┘
         │
         │ Propagates to
         ▼
┌─────────────────┐
│ Parent AP       │
│ options: {      │
│   min: 0,       │
│   max: 100      │
│ }               │
└────────┬────────┘
         │
         │ Used by
         ▼
┌─────────────────┐
│ Molecule        │
│ createInput-    │
│ Params()        │
└────────┬────────┘
         │
         │ Generates
         ▼
┌─────────────────┐
│ rangeSlider     │
│ config {        │
│   type: "range- │
│         Slider" │
│   min: 0,       │
│   max: 100,     │
│   value: 50     │
│ }               │
└────────┬────────┘
         │
         │ Rendered by
         ▼
┌─────────────────┐
│SimpleControl-   │
│Panel.jsx        │
│ <input          │
│   type="range"  │
│   min={min}     │
│   max={max}     │
│   value={val} />│
└─────────────────┘
```

## Implementation Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        File Structure                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  src/molecules/input.js                                      │
│  ├─ DEFAULT_RANGE_MIN = 0                                    │
│  ├─ DEFAULT_RANGE_MAX = 100                                  │
│  ├─ updateParentAPRangeOptions() [helper method]            │
│  └─ createInputParams()                                      │
│     └─ if (type === "range")                                 │
│        ├─ Add rangeMin control                               │
│        └─ Add rangeMax control                               │
│                                                              │
│  src/prototypes/atom.js                                      │
│  └─ createInputParams()                                      │
│     └─ if (input.valueType === "range")                      │
│        └─ Create rangeSlider control config                  │
│                                                              │
│  src/components/secondary/SimpleControlPanel.jsx             │
│  └─ switch (config.type)                                     │
│     └─ case "rangeSlider":                                   │
│        ├─ Render <input type="range" />                      │
│        ├─ Display min/max/current value                      │
│        └─ Handle onChange/onMouseUp/onTouchEnd               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Usage Examples

### Example 1: Height Parameter
```javascript
// Input atom configuration:
Input Name: "height"
Type: "range"
Min: 10
Max: 200
Default value: 100

// Results in slider:
[──────────●──────────]
10        100        200

// In code atom:
return makeCylinder({
  height: height,  // value from slider
  radius: 5
});
```

### Example 2: Percentage Parameter
```javascript
// Input atom configuration:
Input Name: "opacity"
Type: "range"
Min: 0
Max: 1
Default value: 0.5

// Results in slider:
[──────●──────────────]
0     0.5           1

// In code atom:
return shape.setOpacity(opacity);
```

### Example 3: Angle Parameter
```javascript
// Input atom configuration:
Input Name: "rotation"
Type: "range"
Min: 0
Max: 360
Default value: 45

// Results in slider:
[──●──────────────────]
0  45              360

// In code atom:
return shape.rotate([0, 0, 1], rotation);
```
