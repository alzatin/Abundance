# Manual Testing Guide: README Atom Subscription

## What Was Fixed

Previously, when a README atom inside a molecule had its text changed, the molecule's compiled README would not update automatically. This was because README atoms were not part of the molecule's propagation chain.

Now, when you change a README atom's text, the molecule automatically:
1. Detects the change through the subscription mechanism
2. Re-compiles its README content
3. Updates the displayed README in the molecule's properties panel

## How to Test Manually

### Prerequisites
1. Start the development server: `npm start`
2. Open the application at http://localhost:4444
3. Login with GitHub (or use an existing project)

### Test Scenario 1: Simple README Update in Molecule

1. **Create a new molecule:**
   - Create a new molecule called "TestMolecule"
   - Double-click to enter it

2. **Add a README atom inside the molecule:**
   - Add a README atom
   - Set its text to "Initial README text"

3. **Navigate back to the parent molecule:**
   - Click the "up" arrow in the top right to go back to the parent
   - Select the "TestMolecule" molecule
   - Open its properties panel (right side)

4. **Verify initial README display:**
   - You should see a "README:" heading in the properties panel
   - Below it should be the text: "Initial README text"

5. **Change the README text:**
   - Double-click "TestMolecule" to enter it again
   - Select the README atom
   - Change its text to "Updated README text"

6. **Verify automatic update:**
   - Navigate back to the parent molecule (click up arrow)
   - Select "TestMolecule" again
   - **Expected:** The README in the properties panel should now show "Updated README text"
   - **Before fix:** It would still show "Initial README text" until you reloaded the project

### Test Scenario 2: Multiple README Atoms

1. **Create a molecule with multiple README atoms:**
   - Create a new molecule called "MultiReadme"
   - Enter the molecule
   - Add two README atoms:
     - README 1: "First section content"
     - README 2: "Second section content"

2. **Navigate back and check initial state:**
   - Go to parent molecule
   - Select "MultiReadme"
   - Verify both sections appear in the README display

3. **Update one README atom:**
   - Enter "MultiReadme"
   - Change README 1 to "Updated first section"

4. **Verify selective update:**
   - Navigate back
   - Select "MultiReadme"
   - **Expected:** First section shows "Updated first section", second section unchanged

### Test Scenario 3: Nested Molecules with README

1. **Create nested structure:**
   - Create "ParentMolecule"
   - Inside it, create "ChildMolecule"
   - Inside "ChildMolecule", add a README: "Child documentation"

2. **Check parent README compilation:**
   - Navigate to "ParentMolecule"
   - Select it
   - **Expected:** Properties panel should show "### ChildMolecule" heading followed by "Child documentation"

3. **Update child README:**
   - Enter "ParentMolecule" → "ChildMolecule"
   - Update README to "Updated child documentation"

4. **Verify propagation:**
   - Navigate back to "ParentMolecule"
   - Select it
   - **Expected:** README should show updated content

### What to Look For

✅ **Success indicators:**
- README content in molecule properties updates immediately after changing a README atom
- No need to reload the project or re-enter/exit the molecule
- Multiple README atoms all update independently
- Nested molecules propagate README changes correctly

❌ **Failure indicators:**
- README content doesn't update until you reload the project
- Need to close and reopen the molecule to see changes
- Changes don't appear at all

## Technical Details

### Implementation Location
- **File:** `src/molecules/molecule.js`
- **Method:** `deserialize()` around lines 1232-1256
- **Key change:** Added subscription from README atoms to molecule, triggering `requestReadme()` on changes

### How It Works

```javascript
// In molecule.deserialize()
this.nodesOnTheScreen.forEach((atom) => {
  if (atom.atomType === "Readme") {
    atom.subscribe(
      () => {
        // When README atom changes, recompile molecule's README
        this.requestReadme()
          .then((readme) => {
            this.compiledReadme = readme;
            // Note: setInputChanged is not called here as it's only used for BOM updates
            // README changes are reflected automatically in the properties panel
            // through the compiledReadme property
          })
          .catch((err) => {
            console.warn(
              `Error updating README after atom change in molecule ${this.uniqueID}, README atom ${atom.uniqueID}:`,
              err
            );
          });
      },
      `readme-subscription-${this.uniqueID}-${atom.uniqueID}`,
      false
    );
  }
});
```

### When README Updates Trigger

1. User edits README text in the atom's properties panel
2. README atom calls `setReady(newText)` (in `readme.js` line 104)
3. `setReady()` propagates change to all subscribers
4. Molecule receives notification via subscription
5. Molecule calls `requestReadme()` to recompile
6. `compiledReadme` property is updated
7. Properties panel reflects the new content

## Troubleshooting

If README updates don't appear automatically:

1. **Check browser console** for errors related to README compilation
2. **Verify the molecule is selected** - updates only refresh when molecule is selected
3. **Ensure README atom is global** - `global: true` property should be set (default for README atoms)
4. **Check subscription** - In console, verify subscriptions were created during deserialization

## Related Files

- `src/molecules/molecule.js` - Main implementation
- `src/molecules/readme.js` - README atom definition
- `tests/readme-atom-subscription.test.js` - Test validating the subscription mechanism
- `tests/molecule-readme-display.test.js` - Tests for README display
- `tests/readme-generation-integration.test.js` - Integration tests for README compilation
