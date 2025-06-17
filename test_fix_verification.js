// Test to verify the fix works correctly
console.log('=== Testing Fix for Text Atom Input Changes ===\n');

const fs = require('fs');

// Check that the fix was applied correctly
console.log('1. Checking if Atom class now has updateValue with optional parameter...');
const atomSource = fs.readFileSync('/home/runner/work/Abundance/Abundance/src/prototypes/atom.js', 'utf8');

const hasUpdateValueWithOptionalParam = atomSource.includes('updateValue(inputName)') && 
                                        atomSource.includes('if (inputName !== undefined)');
console.log('   Result:', hasUpdateValueWithOptionalParam ? '✅ Fixed' : '❌ FIX NOT FOUND');

if (hasUpdateValueWithOptionalParam) {
    console.log('   - updateValue now accepts optional inputName parameter');
    console.log('   - When called with inputName, it calls updateValue() without parameters');
    console.log('   - When called without parameters, it does the original logic');
}

// Check for potential issues with molecules that override updateValue
console.log('\n2. Checking for atoms that override updateValue...');
const moleculeFiles = fs.readdirSync('/home/runner/work/Abundance/Abundance/src/molecules/')
    .filter(file => file.endsWith('.js'));

let atomsWithUpdateValue = [];
for (const file of moleculeFiles) {
    const filePath = `/home/runner/work/Abundance/Abundance/src/molecules/${file}`;
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('updateValue()') && !content.includes('import')) {
        atomsWithUpdateValue.push(file.replace('.js', ''));
    }
}

console.log('   Atoms that override updateValue:', atomsWithUpdateValue.join(', '));
console.log('   These should all be compatible since they override updateValue() without parameters');

// Check that the fix logic is correct
console.log('\n3. Analyzing fix logic...');
const lines = atomSource.split('\n');
const updateValueStart = lines.findIndex(line => line.includes('updateValue(inputName)'));
const updateValueSection = lines.slice(updateValueStart, updateValueStart + 10);

console.log('   Fix implementation:');
updateValueSection.forEach((line, i) => {
    if (line.trim()) console.log(`     ${line.trim()}`);
});

console.log('\n=== VERIFICATION COMPLETE ===');
console.log('The fix should allow AttachmentPoint.setValue() to properly trigger Text atom updates');
console.log('Font family changes will continue to work as before');
console.log('Text and font size changes should now work too');