# AI Prompt Feature for Code Atoms

## Overview

The AI Prompt feature provides a comprehensive guide that can be copied to your clipboard and pasted into AI assistants (like ChatGPT, Claude, or GitHub Copilot) to help generate code for Abundance Code Atoms.

## How to Use

1. **Open a Code Atom**: Double-click on a Code atom in the flow canvas or select it and click "Edit Code"
2. **Find the AI Helper Button**: In the code editor window, look for the "Copy AI Prompt" button in the right panel (below the Code Window Guide)
3. **Click to Copy**: Click the "🤖 Copy AI Prompt" button
4. **Paste into Your AI Assistant**: Open your preferred AI assistant and paste the copied prompt
5. **Add Your Requirements**: After the prompt, describe what you want the code to do
6. **Get Generated Code**: The AI will generate code following Abundance's structure and best practices

## What's Included in the Prompt

The generated prompt includes:

### 1. Code Structure Requirements
- How to define inputs using the `Inputs` array
- Input types (geometry, number, string)
- AbundanceObject structure
- Return value requirements

### 2. Available Functions
- **Abundance Methods**: Move, Rotate, Scale, Assembly, Intersect, Fillet, Chamfer, etc.
- **Replicad API**: makePlane, drawCircle, extrude, and other CAD operations
- Complete parameter lists and return types

### 3. Common Patterns
- Importing and using geometry
- Creating new geometry with Replicad
- Transforming geometry
- Boolean operations
- Adding features (fillets, chamfers)
- Working with assemblies

### 4. Best Practices
- Always use `await` with Abundance functions
- Wrap raw Replicad geometry in AbundanceObject
- Use meaningful tags for parts
- Include BOM entries for manufacturing
- Handle null geometry from inputs

### 5. Examples
- Complete working code examples
- Common use cases
- Edge case handling

### 6. Mistakes to Avoid
- Common errors developers make
- How to prevent them

## Example Usage

### Step 1: Copy the Prompt
Click the "🤖 Copy AI Prompt" button in the code editor.

### Step 2: Paste into AI and Add Requirements
```
[Paste the AI prompt here]

Now, please generate code for the following:
Create a parametric bracket with:
- Input for base width (number, default 50)
- Input for height (number, default 30)
- Input for thickness (number, default 3)
- Input for hole diameter (number, default 5)
- Create a rectangular base with the specified dimensions
- Extrude to the specified thickness
- Add two mounting holes at opposite corners
- Apply a 1mm fillet to all edges
- Return the result as an AbundanceObject
```

### Step 3: Use Generated Code
The AI will generate properly structured code that you can paste into your Code atom.

## Tips for Best Results

1. **Be Specific**: Provide exact dimensions, positions, and requirements
2. **Mention Inputs**: Specify which parameters should be inputs
3. **Describe Geometry**: Clearly describe shapes, transformations, and relationships
4. **Ask for Comments**: Request commented code for better understanding
5. **Iterate**: If the first result isn't perfect, refine your request

## Troubleshooting

### Prompt Not Copying
- Make sure your browser allows clipboard access
- Try clicking the button again
- If the alert doesn't appear, check browser console for errors

### AI Doesn't Understand
- Make sure you pasted the full prompt
- Add more specific details about what you want
- Reference similar existing code atoms as examples

### Generated Code Doesn't Work
- Check that all inputs are declared in the Inputs array
- Verify all Abundance functions use `await`
- Ensure raw Replicad geometry is wrapped in AbundanceObject
- Check for syntax errors or typos

## Technical Details

### Implementation
- **File**: `src/js/codeAtomPromptGenerator.js`
- **UI Component**: `src/components/secondary/codeWindow.jsx`
- **Tests**: `tests/code-atom-prompt.test.js`

### Prompt Generation
The prompt is dynamically generated from:
- `abundanceApiJson.json` - Abundance method definitions
- `methodsreplicad.json` - Replicad API definitions
- Hardcoded best practices and examples

### Browser Compatibility
Uses the Clipboard API (`navigator.clipboard.writeText`) which is supported in:
- Chrome 66+
- Firefox 63+
- Safari 13.1+
- Edge 79+

## Future Enhancements

Potential improvements:
- Add ability to include current code as context
- Suggest improvements to existing code
- Generate test cases for code atoms
- Context-aware prompts based on connected atoms
- Multi-language support

## Related Documentation

- [Code Atom Guide](../README.md#code-atoms)
- [Replicad API Documentation](https://replicad.xyz)
- [Abundance API Reference](../src/components/secondary/abundanceApiJson.json)
