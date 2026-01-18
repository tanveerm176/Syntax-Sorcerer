/**
 * CSV Export Module
 *
 * Provides functionality to export extracted code elements to CSV format.
 * This is useful for data analysis, auditing, and backup purposes.
 *
 * CSV Format:
 * - Columns: Type, Name, Code, Filepath, Embedding
 * - Type: "function", "class", or "misc"
 * - Embedding: JSON-stringified array of 1536 floats
 *
 * @module writeToCSV
 */
import { createObjectCsvWriter as createCsvWriter } from "csv-writer";

/**
 * Writes extracted code elements to a CSV file
 *
 * Combines functions and classes into a single CSV with standardized columns.
 * Each code element is represented as one row with its metadata and full embedding vector.
 *
 * @param {Object} data - The extracted code elements with embeddings
 * @param {Array} data.functions - Array of function objects with {code, function_name, filepath, embedding}
 * @param {Array} data.classes - Array of class objects with {code, class_name, filepath, embedding}
 * @param {string} outputPath - The file path where the CSV should be written
 *
 * @returns {Promise<void>} Resolves when the file is successfully written
 *
 * @example
 * const data = {
 *   functions: [{code: '...', function_name: 'add', filepath: 'utils.js', embedding: [...]}],
 *   classes: [{code: '...', class_name: 'Logger', filepath: 'logger.js', embedding: [...]}]
 * };
 * await writeToCsv(data, './output/code_analysis.csv');
 */
export function writeToCsv(data, outputPath) {
  // Define CSV column structure
  const csvWriter = createCsvWriter({
    path: outputPath,
    header: [
      { id: "type", title: "Type" },
      { id: "name", title: "Name" },
      { id: "code", title: "Code" },
      { id: "filepath", title: "Filepath" },
      { id: "embedding", title: "Embedding" },
    ],
  });

  // Combine all extracted data into a single array for CSV writing
  const records = [
    // Convert functions to CSV records
    ...data.functions.map((item) => ({
      type: "function",
      name: item.function_name,
      code: item.code,
      filepath: item.filepath,
      embedding: JSON.stringify(item.embedding), // Serialize embedding vector to JSON
    })),
    // Convert classes to CSV records
    ...data.classes.map((item) => ({
      type: "class",
      name: item.class_name,
      code: item.code,
      filepath: item.filepath,
      embedding: JSON.stringify(item.embedding), // Serialize embedding vector to JSON
    })),
    /* Placeholder for future support of miscellaneous code blocks
      ...data.misc.map(item => ({
        type: 'misc',
        name: '',
        code: item.code,
        filepath: item.filepath,
        embeddings: JSON.stringify(item.embedding)
      })) */
  ];

  // Write records to CSV file
  csvWriter
    .writeRecords(records)
    .then(() => console.log("CSV file was written successfully"));
}
