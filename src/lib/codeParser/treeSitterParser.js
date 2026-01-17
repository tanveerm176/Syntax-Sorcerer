import fs from "fs";
import path from "path";
import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";

const parser = new Parser();
parser.setLanguage(JavaScript);

/**
 * Extracts code segments from a JavaScript file using Tree-Sitter AST parsing.
 *
 * This provides accurate parsing of complex JavaScript patterns including:
 * - Function declarations and arrow functions
 * - Class declarations and methods
 * - Variable declarations
 * - Destructured exports and imports
 * - Complex nested structures
 *
 * @param {string} filepath - Path to the JavaScript file to parse
 * @returns {Promise<{functions: Array, classes: Array, relativeFilePath: string}>}
 */
export async function parseCodeWithTreeSitter(filepath) {
  try {
    const fileContent = fs.readFileSync(filepath, "utf8");
    const relativeFilePath = path.relative(process.cwd(), filepath);

    const tree = parser.parse(fileContent);
    const functions = [];
    const classes = [];

    /**
     * Recursively traverses the AST and extracts functions and classes
     */
    function traverse(node) {
      // Extract function declarations
      if (
        node.type === "function_declaration" ||
        node.type === "arrow_function" ||
        node.type === "function_expression"
      ) {
        const nameNode = node.child(1); // Usually the second child is the name
        const functionName =
          node.type === "function_declaration" && nameNode
            ? nameNode.text
            : extractFunctionName(node, fileContent);

        if (functionName && functionName !== "anonymous") {
          functions.push({
            code: node.text,
            function_name: functionName,
            filepath: relativeFilePath,
          });
        }
      }

      // Extract class declarations
      if (node.type === "class_declaration") {
        const nameNode = node.childForFieldName("name");
        const className = nameNode ? nameNode.text : null;

        if (className) {
          classes.push({
            code: node.text,
            class_name: className,
            filepath: relativeFilePath,
          });
        }
      }

      // Recursively process child nodes
      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i));
      }
    }

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
 * @private
 */
function extractFunctionName(node, fileContent) {
  const lines = fileContent.split("\n");

  // For variable declarations with function assignments
  if (node.parent && node.parent.type === "variable_declarator") {
    const parentNameNode = node.parent.childForFieldName("name");
    if (parentNameNode) {
      return parentNameNode.text;
    }
  }

  // For object properties with function values
  if (node.parent && node.parent.type === "pair") {
    const keyNode = node.parent.childForFieldName("key");
    if (keyNode) {
      return keyNode.text;
    }
  }

  // Default to anonymous
  return "anonymous";
}
