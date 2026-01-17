/**
 * Type definitions and schemas for code parser output
 */

/**
 * @typedef {Object} CodeFunction
 * @property {string} code - The complete function source code
 * @property {string} function_name - The name of the function
 * @property {string} filepath - Relative path to the source file
 */

/**
 * @typedef {Object} CodeClass
 * @property {string} code - The complete class source code
 * @property {string} class_name - The name of the class
 * @property {string} filepath - Relative path to the source file
 */

/**
 * @typedef {Object} MiscCodeBlock
 * @property {string} code - The miscellaneous code segment
 * @property {string} filepath - Relative path to the source file
 */

/**
 * @typedef {Object} ParserOutput
 * @property {CodeFunction[]} functions - Extracted functions
 * @property {CodeClass[]} classes - Extracted classes
 * @property {string} relativeFilePath - Relative path from cwd to the source file
 * @property {MiscCodeBlock[]} [misc] - Optional miscellaneous code blocks
 */

export const CodeParserTypes = {
  /**
   * Validates that output matches expected parser structure
   * @param {ParserOutput} output - The parser output to validate
   * @returns {boolean}
   */
  isValidParserOutput: (output) => {
    return (
      output &&
      typeof output === "object" &&
      Array.isArray(output.functions) &&
      Array.isArray(output.classes) &&
      typeof output.relativeFilePath === "string"
    );
  },

  /**
   * Validates a single function object
   * @param {CodeFunction} func - The function to validate
   * @returns {boolean}
   */
  isValidFunction: (func) => {
    return (
      func &&
      typeof func.code === "string" &&
      typeof func.function_name === "string" &&
      typeof func.filepath === "string"
    );
  },

  /**
   * Validates a single class object
   * @param {CodeClass} cls - The class to validate
   * @returns {boolean}
   */
  isValidClass: (cls) => {
    return (
      cls &&
      typeof cls.code === "string" &&
      typeof cls.class_name === "string" &&
      typeof cls.filepath === "string"
    );
  },
};
