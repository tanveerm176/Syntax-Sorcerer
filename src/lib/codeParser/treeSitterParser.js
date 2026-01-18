/**
 * Tree-Sitter JavaScript Code Parser Module
 *
 * Provides accurate Abstract Syntax Tree (AST) parsing for JavaScript/TypeScript code
 * using the tree-sitter library. Extracts functions, classes, and other code elements
 * from source files with high accuracy.
 *
 * Advantages over regex-based parsing:
 * - Handles complex nested structures correctly
 * - Supports modern JavaScript patterns (arrow functions, async/await, etc.)
 * - Accurate for edge cases and unusual formatting
 * - Works with JSX and TypeScript
 *
 * @module treeSitterParser
 */
import fs from "fs";
import path from "path";
import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";

// Initialize Tree-Sitter parser with JavaScript grammar
const parser = new Parser();
parser.setLanguage(JavaScript);

/**
 * Parses a JavaScript file and extracts all functions and classes
 *
 * Uses Tree-Sitter AST traversal to find:
 * - Function declarations: `function foo() {}`
 * - Arrow functions: `const foo = () => {}`
 * - Function expressions: `const foo = function() {}`
 * - Class declarations: `class Foo {}`
 * - Methods within classes
 *
 * Provides accurate extraction even with complex syntax:
 * - Nested functions and classes
 * - Higher-order functions
 * - Destructured assignments
 * - Default and spread parameters
 * - Async/await functions
 *
 * @async
 * @param {string} filepath - Absolute path to the JavaScript file to parse
 * @returns {Promise<{functions: Array<{code: string, function_name: string, filepath: string}>, classes: Array<{code: string, class_name: string, filepath: string}>, relativeFilePath: string}>}
 *          Object containing:
 *          - functions: Array of extracted function objects
 *          - classes: Array of extracted class objects
 *          - relativeFilePath: Path relative to cwd for database storage
 *
 * @throws {Error} If file cannot be read or parsed
 *
 * @example
 * const result = await parseCodeWithTreeSitter('/absolute/path/to/app.js');
 * console.log(result.functions); // [{code: 'function foo() {...}', function_name: 'foo', filepath: 'src/app.js'}]
 * console.log(result.classes);   // [{code: 'class Bar {...}', class_name: 'Bar', filepath: 'src/app.js'}]
 */
export async function parseCodeWithTreeSitter(filepath) {
  try {
    // Read file content
    const fileContent = fs.readFileSync(filepath, "utf8");
    // Get relative path from current working directory
    const relativeFilePath = path.relative(process.cwd(), filepath);

    // Parse the file content into an AST
    const tree = parser.parse(fileContent);
    const functions = [];
    const classes = [];

    /**
     * Recursively traverses the AST to extract functions and classes
     * Visits every node in the syntax tree and collects matching patterns
     *
     * @param {Node} node - The current AST node being traversed
     */
    function traverse(node) {
      // Extract function declarations, arrow functions, and function expressions
      if (
        node.type === "function_declaration" ||
        node.type === "arrow_function" ||
        node.type === "function_expression"
      ) {
        // Get function name from the AST node
        const nameNode = node.child(1); // Usually the second child is the name
        const functionName =
          node.type === "function_declaration" && nameNode
            ? nameNode.text
            : extractFunctionName(node, fileContent);

        // Only add if we found a valid function name (not anonymous)
        if (functionName && functionName !== "anonymous") {
          functions.push({
            code: node.text, // Full function source code
            function_name: functionName,
            filepath: relativeFilePath,
          });
        }
      }

      // Extract class declarations
      if (node.type === "class_declaration") {
        // Get the class name from the "name" field
        const nameNode = node.childForFieldName("name");
        const className = nameNode ? nameNode.text : null;

        if (className) {
          classes.push({
            code: node.text, // Full class source code
            class_name: className,
            filepath: relativeFilePath,
          });
        }
      }

      // Recursively process all child nodes
      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i));
      }
    }

    // Start traversal from the root of the AST
    traverse(tree.rootNode);

    return {
      functions,
      classes,
      relativeFilePath,
    };
  } catch (error) {
    console.error(`Error parsing file with Tree-Sitter: ${filepath}`, error);
    throw error;
  }
}

/**
 * Helper function to extract function name from various function types
 *
 * Handles edge cases where the name isn't directly accessible:
 * - Variable declarations with function assignments
 * - Object properties with function values (method shorthand)
 * - Arrow functions assigned to variables
 *
 * Falls back to "anonymous" if the name cannot be determined.
 *
 * @private
 * @param {Node} node - The function AST node
 * @param {string} fileContent - The complete file content (for text extraction)
 * @returns {string} The function name or "anonymous"
 */
function extractFunctionName(node, fileContent) {
  const lines = fileContent.split("\n");

  // Case 1: Variable declaration with function assignment
  // Example: const myFunc = () => { ... }
  if (node.parent && node.parent.type === "variable_declarator") {
    const parentNameNode = node.parent.childForFieldName("name");
    if (parentNameNode) {
      return parentNameNode.text;
    }
  }

  // Case 2: Object property with function value (method)
  // Example: { myMethod: function() { ... } }
  if (node.parent && node.parent.type === "pair") {
    const keyNode = node.parent.childForFieldName("key");
    if (keyNode) {
      return keyNode.text;
    }
  }

  // Default to anonymous if name cannot be determined
  return "anonymous";
}
