// Simple test to reproduce the equation issue
const { create, all } = require("./node_modules/mathjs");

// Simulate the current problematic behavior
function testCurrentBehavior() {
    const math = create(all);
    
    // Test equation: 15 + (y/2)
    let equation = "15 + (y/2)";
    console.log("Original equation:", equation);
    
    // Current problematic logic - using simple replace
    let substitutedEquation = equation;
    const variables = equation.match(/[a-zA-Z]/g);
    console.log("Variables found:", variables);
    
    // Simulate variable replacement with y = 6
    const yValue = 6;
    substitutedEquation = substitutedEquation.replace("y", yValue);
    console.log("After replacement:", substitutedEquation);
    
    try {
        const result = math.evaluate(substitutedEquation);
        console.log("Result:", result);
        console.log("Expected result for 15 + (6/2):", 15 + (6/2)); // Should be 18
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Test improved behavior with word boundaries
function testImprovedBehavior() {
    const math = create(all);
    
    let equation = "15 + (y/2)";
    console.log("\n--- Improved behavior test ---");
    console.log("Original equation:", equation);
    
    // Better variable detection with word boundaries
    const variableRegex = /\b[a-zA-Z]+\b/g;
    const variables = equation.match(variableRegex);
    console.log("Variables found with word boundaries:", variables);
    
    // Better replacement using word boundaries
    let substitutedEquation = equation;
    const yValue = 6;
    
    // Use word boundary regex for replacement
    const variablePattern = new RegExp(`\\b${"y"}\\b`, 'g');
    substitutedEquation = substitutedEquation.replace(variablePattern, yValue);
    console.log("After replacement:", substitutedEquation);
    
    try {
        const result = math.evaluate(substitutedEquation);
        console.log("Result:", result);
        console.log("Expected result for 15 + (6/2):", 15 + (6/2)); // Should be 18
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Test more complex cases
function testComplexCases() {
    const math = create(all);
    
    const testCases = [
        { equation: "15 + (y/2)", variables: { y: 6 }, expected: 18 },
        { equation: "x + y * z", variables: { x: 1, y: 2, z: 3 }, expected: 7 },
        { equation: "sin(x) + cos(y)", variables: { x: 0, y: 0 }, expected: 2 },
        { equation: "sqrt(x) + y^2", variables: { x: 4, y: 3 }, expected: 11 },
        { equation: "a * (b + c) / d", variables: { a: 2, b: 3, c: 4, d: 2 }, expected: 7 }
    ];
    
    console.log("\n--- Testing complex cases ---");
    
    testCases.forEach((testCase, index) => {
        console.log(`\nTest ${index + 1}: ${testCase.equation}`);
        
        // Current method
        let substitutedEquation = testCase.equation;
        const variables = testCase.equation.match(/[a-zA-Z]/g);
        console.log("Variables found:", variables);
        
        // Replace each variable
        if (variables) {
            const uniqueVars = [...new Set(variables)];
            uniqueVars.forEach(variable => {
                if (testCase.variables[variable] !== undefined) {
                    substitutedEquation = substitutedEquation.replace(new RegExp(variable, 'g'), testCase.variables[variable]);
                }
            });
        }
        
        console.log("After replacement:", substitutedEquation);
        
        try {
            const result = math.evaluate(substitutedEquation);
            console.log("Result:", result, "Expected:", testCase.expected);
            console.log("Match:", Math.abs(result - testCase.expected) < 0.0001 ? "✓" : "✗");
        } catch (error) {
            console.error("Error:", error.message);
        }
    });
}

function testProblematicCase() {
    const math = create(all);
    
    console.log("\n--- Testing problematic replacement scenarios ---");
    
    // Test case where variable letters might conflict with function names
    let equation = "sin(x) + y";
    console.log("Equation:", equation);
    
    const variables = equation.match(/[a-zA-Z]/g);
    console.log("All letters found:", variables); // This will include s, i, n from sin
    
    // This could cause issues if we try to replace 's', 'i', 'n'
    let substitutedEquation = equation;
    if (variables) {
        // Simulate what happens if we incorrectly try to replace 's' with a value
        if (variables.includes('s')) {
            substitutedEquation = substitutedEquation.replace('s', '5');
            console.log("After replacing 's' with 5:", substitutedEquation);
        }
    }
}

testCurrentBehavior();
testImprovedBehavior();
testComplexCases();
testProblematicCase();