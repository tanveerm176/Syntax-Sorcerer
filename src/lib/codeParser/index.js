/**
 * Code Parser Module - Main Interface
 *
 * This module provides a unified interface for parsing JavaScript code files.
 * Currently implements Tree-Sitter-based parsing for accurate AST analysis.
 *
 * Usage:
 *   import { parseCodeFile } from '@/lib/codeParser';
 *   const result = await parseCodeFile('./src/index.js');
 */

import { parseCodeWithTreeSitter } from "./treeSitterParser";
import { CodeParserTypes } from "./types";

/**
 * Main parser function - parses a JavaScript file and extracts code structures
 *
 * @param {string} filepath - Absolute path to the JavaScript file
 * @returns {Promise<{functions: Array, classes: Array, comments: Array, variables: Array, relativeFilePath: string}>}
 *          Returns an object with:
 *          - functions: Array of function objects with {code, function_name, filepath}
 *          - classes: Array of class objects with {code, class_name, filepath}
 *          - comments: Array of comment objects with {code, comment_name, filepath}
 *          - variables: Array of variable objects with {code, variable_name, filepath}
 *          - relativeFilePath: Relative path from cwd to the file
 *
 * @throws {Error} If file cannot be read or parsed
 *
 * @example
 * const parser = await parseCodeFile('/absolute/path/to/file.js');
 * console.log(parser.functions);  // [{code: '...', function_name: 'myFunc', filepath: 'src/file.js'}]
/*  * console.log(parser.comments);   // [{code: '/** JSDoc */ //', comment_name: 'comment_1', filepath: 'src/file.js'}]
//  * console.log(parser.variables);  // [{code: 'const x = 10', variable_name: 'x', filepath: 'src/file.js'}]
//   */ */
export async function parseCodeFile(filepath) {
  try {
    // Use Tree-Sitter for parsing
    const result = await parseCodeWithTreeSitter(filepath);

    // Validate output structure
    if (!CodeParserTypes.isValidParserOutput(result)) {
      throw new Error("Parser output validation failed");
    }

    return result;
  } catch (error) {
    console.error(`Failed to parse code file: ${filepath}`, error.message);
    throw error;
  }
}

/**
 * Validates parser output structure
 * Useful for testing and debugging
 *
 * @param {*} output - The output to validate
 * @returns {boolean} True if output matches expected structure
 */
export function validateParserOutput(output) {
  return CodeParserTypes.isValidParserOutput(output);
}

/**
 * Exports type definitions for use in other modules
 */
export { CodeParserTypes } from "./types";
