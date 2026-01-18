/**
 * Embedding Service Module
 *
 * Provides functionality for generating vector embeddings from text using OpenAI's API.
 * These embeddings are used to create semantic representations of code for similarity search
 * in the Pinecone vector database.
 *
 * Uses the text-embedding-ada-002 model for all embeddings:
 * - Dimension: 1536
 * - Input limit: ~8,000 tokens per request
 *
 * @module embeddingService
 */
import { openai } from "../config/openAIConfig";

/**
 * Generates a vector embedding for the given text using OpenAI's API
 *
 * The embedding is a 1536-dimensional vector that represents the semantic meaning
 * of the input text. Used for similarity search in Pinecone.
 *
 * @async
 * @param {string} text - The text to generate an embedding for (code, function name, etc.)
 * @returns {Promise<number[]>} Array of 1536 floating-point numbers representing the embedding
 * @throws {Error} If OpenAI API call fails
 *
 * @example
 * const embedding = await generateEmbeddings('function addNumbers(a, b) { return a + b; }');
 * // Returns: [0.123, -0.456, 0.789, ..., 0.012] (1536 values)
 */
export async function generateEmbeddings(text) {
  try {
    // Request embeddings from OpenAI's text-embedding-ada-002 model
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002", // Use OpenAI's fast and efficient embedding model
      input: text,
      encoding_format: "float", // Request float format for precise vector values
    });

    // Extract and return the embedding vector
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embeddings with OpenAI:", error);
  }
}

/**
 * Processes a collection of extracted code (functions and classes) to add embeddings
 * Iterates through all functions and classes, generating embeddings for each
 *
 * @async
 * @param {Object} dict - Dictionary containing extracted code blocks
 * @param {Array} dict.functions - Array of function objects with {code, function_name, filepath}
 * @param {Array} dict.classes - Array of class objects with {code, class_name, filepath}
 * @returns {Promise<Object>} The same dictionary with added embedding field on each function and class
 *
 * @example
 * const codeDict = {
 *   functions: [{code: 'function add(...) {...}', function_name: 'add', filepath: 'utils.js'}],
 *   classes: []
 * };
 * const withEmbeddings = await processAndUpdateDictionary(codeDict);
 * // Returns: {functions: [{code: '...', function_name: 'add', filepath: '...', embedding: [...]}], classes: []}
 */
export async function processAndUpdateDictionary(dict) {
  // Generate embeddings for all extracted functions
  for (const func of dict.functions) {
    const embedding = await generateEmbeddings(func.code);
    if (embedding) {
      func.embedding = embedding;
    }
  }

  // Generate embeddings for all extracted classes
  for (const cls of dict.classes) {
    const embedding = await generateEmbeddings(cls.code);
    if (embedding) {
      cls.embedding = embedding;
    }
  }

  return dict;
}
