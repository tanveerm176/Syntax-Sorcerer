/**
 * Sample test file for Tree-Sitter parser validation
 */

// Function declaration
function greet(name) {
  return `Hello, ${name}!`;
}

// Arrow function assigned to variable
const add = (a, b) => {
  return a + b;
};

// Class definition
class Calculator {
  constructor(initialValue = 0) {
    this.value = initialValue;
  }

  add(x) {
    this.value += x;
    return this.value;
  }

  multiply(x) {
    this.value *= x;
    return this.value;
  }
}

// Exported arrow function
export const subtract = (a, b) => a - b;

// Variable declaration
let counter = 0;

// Complex function with nested logic
function processData(data) {
  const filtered = data.filter((item) => item.active);
  const mapped = filtered.map((item) => ({
    ...item,
    processed: true,
  }));
  return mapped;
}
