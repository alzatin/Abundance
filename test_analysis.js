// Test to reproduce the Text atom input update issue
console.log('=== Testing Text Atom Input Changes ===\n');

// Check if the Atom base class has updateValue(name) method
const fs = require('fs');
const atomSource = fs.readFileSync('/home/runner/work/Abundance/Abundance/src/prototypes/atom.js', 'utf8');

console.log('1. Checking if Atom class has updateValue(name) method...');
const hasUpdateValueWithParam = atomSource.includes('updateValue(') && atomSource.includes('updateValue(name)');
console.log('   Result:', hasUpdateValueWithParam ? '✅ Found' : '❌ NOT FOUND');

if (!hasUpdateValueWithParam) {
    console.log('   - Only found updateValue() without parameters');
}

// Check AttachmentPoint trying to call updateValue(name)
console.log('\n2. Checking if AttachmentPoint calls updateValue(name)...');
const apSource = fs.readFileSync('/home/runner/work/Abundance/Abundance/src/prototypes/attachmentpoint.js', 'utf8');
const callsUpdateValueWithName = apSource.includes('this.parentMolecule.updateValue(this.name)');
console.log('   Result:', callsUpdateValueWithName ? '✅ Found' : '❌ NOT FOUND');

if (callsUpdateValueWithName) {
    console.log('   - AttachmentPoint.setValue() calls this.parentMolecule.updateValue(this.name)');
    console.log('   - But Atom class only has updateValue() without parameters');
    console.log('   - This is the root cause of the issue!');
}

// Check Text atom implementation
console.log('\n3. Checking Text atom updateValue implementation...');
const textSource = fs.readFileSync('/home/runner/work/Abundance/Abundance/src/molecules/text.js', 'utf8');
const hasTextUpdateValue = textSource.includes('updateValue()') && textSource.includes('super.updateValue()');
console.log('   Result:', hasTextUpdateValue ? '✅ Found' : '❌ NOT FOUND');

if (hasTextUpdateValue) {
    console.log('   - Text atom properly overrides updateValue() and calls super.updateValue()');
}

// Check how font family change works
console.log('\n4. Checking how font family change works...');
const fontFamilyOnChange = textSource.includes('this.updateValue()') && textSource.includes('FontFamily');
console.log('   Result:', fontFamilyOnChange ? '✅ Found' : '❌ NOT FOUND');

if (fontFamilyOnChange) {
    console.log('   - Font family dropdown directly calls this.updateValue()');
    console.log('   - This is why font changes work but text/size changes don\'t');
}

console.log('\n=== CONCLUSION ===');
console.log('Issue confirmed: AttachmentPoint calls updateValue(name) but Atom class only has updateValue()');
console.log('Solution: Add updateValue(name) method to Atom class that calls updateValue()');
console.log('Or: Modify AttachmentPoint to call updateValue() without parameters');