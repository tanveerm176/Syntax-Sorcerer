/**
 * File Reading Module
 *
 * Provides utility function for asynchronously reading file contents.
 * Used by the code parser to read JavaScript files from the filesystem.
 *
 * @module readCodeFromFile
 */
import fs from "fs";

/**
 * Asynchronously reads and returns the complete contents of a file
 *
 * @async
 * @param {string} filePath - Absolute path to the file to read
 * @returns {Promise<string>} The complete file contents as a UTF-8 string
 * @throws {Error} If file does not exist or cannot be read
 *
 * @example
 * const code = await readCodeFromFile('/absolute/path/to/file.js');
 * console.log(code); // JavaScript source code
 */
export async function readCodeFromFile(filePath) {
  return fs.promises.readFile(filePath, "utf8");
}
