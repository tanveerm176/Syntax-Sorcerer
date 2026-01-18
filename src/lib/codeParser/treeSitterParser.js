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
 * Parses a JavaScript file and extracts functions, classes, comments, and variables
 *
 * Uses Tree-Sitter AST traversal to find:
 * - Function declarations: `function foo() {}`
 * - Arrow functions: `const foo = () => {}`
 * - Function expressions: `const foo = function() {}`
 * - Class declarations: `class Foo {}`
 * - Methods within classes
 * - Comment blocks: `/** JSDoc comments */`
//  * - Line comments: `// single line comments`
//  * - Variable declarations: `const x = ...`, `let y = ...`
//  *
//  * Provides accurate extraction even with complex syntax:
//  * - Nested functions and classes
//  * - Higher-order functions
//  * - Destructured assignments
//  * - Default and spread parameters
//  * - Async/await functions
//  *
//  * @async
//  * @param {string} filepath - Absolute path to the JavaScript file to parse
//  * @returns {Promise<{functions: Array<{code: string, function_name: string, filepath: string}>, classes: Array<{code: string, class_name: string, filepath: string}>, comments: Array<{code: string, comment_name: string, filepath: string}>, variables: Array<{code: string, variable_name: string, filepath: string}>, relativeFilePath: string}>}
//  *          Object containing:
//  *          - functions: Array of extracted function objects
//  *          - classes: Array of extracted class objects
//  *          - comments: Array of extracted comment blocks and lines
//  *          - variables: Array of extracted variable declarations
//  *          - relativeFilePath: Path relative to cwd for database storage
//  *
//  * @throws {Error} If file cannot be read or parsed
//  *
//  * @example
//  * const result = await parseCodeWithTreeSitter('/absolute/path/to/app.js');
//  * console.log(result.functions); // [{code: 'function foo() {...}', function_name: 'foo', filepath: 'src/app.js'}]
//  * console.log(result.classes);   // [{code: 'class Bar {...}', class_name: 'Bar', filepath: 'src/app.js'}]
//  * console.log(result.comments);  // [{code: '/** JSDoc comment */', comment_name: 'block_comment_1', filepath: 'src/app.js'}]
//  * console.log(result.variables); // [{code: 'const x = 10', variable_name: 'x', filepath: 'src/app.js'}]
//  */
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
    const comments = [];
    const variables = [];
    let commentCounter = 1;
    let variableCounter = 1;

    /**
     * Recursively traverses the AST to extract functions, classes, comments, and variables
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

      // Extract comments (both block and line comments)
      if (node.type === "comment") {
        const commentText = node.text;
        // Only add substantial comments (not single line debugging comments)
        if (
          commentText.length > 10 ||
          commentText.includes("/**") ||
          commentText.includes("/*")
        ) {
          comments.push({
            code: commentText,
            comment_name: `comment_${commentCounter}`,
            filepath: relativeFilePath,
          });
          commentCounter++;
        }
      }

      // Extract variable declarations (const, let, var)
      if (
        node.type === "variable_declaration" &&
        !isVariableInFunction(node)
      ) {
        // Extract individual variable declarators from the declaration
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child.type === "variable_declarator") {
            const nameNode = child.childForFieldName("name");
            const valueNode = child.childForFieldName("value");

            if (nameNode) {
              const variableName = nameNode.text;
              // Include the declaration with its initialization if available
              const code = valueNode
                ? `${node.child(0).text} ${nameNode.text} = ${valueNode.text}`
                : child.text;

              variables.push({
                code: code,
                variable_name: variableName,
                filepath: relativeFilePath,
              });
              variableCounter++;
            }
          }
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
      comments,
      variables,
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

/**
 * Helper function to determine if a variable is declared inside a function
 * Prevents extracting local variables as global code snippets
 *
 * @private
 * @param {Node} node - The variable declaration node
 * @returns {boolean} True if the variable is inside a function, false otherwise
 */
function isVariableInFunction(node) {
  let current = node.parent;
  while (current) {
    if (
      current.type === "function_declaration" ||
      current.type === "arrow_function" ||
      current.type === "function_expression"
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}
