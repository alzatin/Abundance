// Test for atom categorization in the menu system
describe("Atom Categorization", () => {
  describe("Menu Categories", () => {
    it("should verify Color atom categorization change", () => {
      // This test verifies the fix for issue #701
      // Since the globalvariables.js module has complex dependencies,
      // we test the change indirectly by checking that the fix is in place
      
      // Read the globalvariables.js file content to verify the change
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../src/js/globalvariables.js');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Check that Color is categorized under "Tags" not "Actions"
      expect(fileContent).toContain('color: { creator: Color, atomType: "Color", atomCategory: "Tags" }');
      expect(fileContent).not.toContain('color: { creator: Color, atomType: "Color", atomCategory: "Actions" }');
    });
  });
});