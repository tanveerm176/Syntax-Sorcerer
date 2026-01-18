/**
 * File Processing Pipeline Module
 *
 * Orchestrates the complete processing of a JavaScript file:
 * 1. Parse code with Tree-Sitter to extract functions and classes
 * 2. Generate vector embeddings using OpenAI
 * 3. Upsert embeddings to Pinecone vector database
 *
 * This is the main entry point for codebase indexing.
 * Called recursively during codebase download for each JavaScript file.
 *
 * @module processFile
 */
import { parseCodeFile } from "@/lib/codeParser";
import { pinecone } from "../config/pinecone/pineconeInit";
import { processAndUpdateDictionary } from "./embeddingService";

/**
 * Processes a single JavaScript file through the complete pipeline
 *
 * Steps:
 * 1. Parse the file using Tree-Sitter AST parser
 *    - Extracts function declarations and class definitions
 *    - Returns relative file paths and source code
 *
 * 2. Generate embeddings for each code element
 *    - Uses OpenAI's text-embedding-ada-002 model
 *    - Creates 1536-dimensional vectors for semantic search
 *    - Processes both functions and classes
 *
 * 3. Upsert embeddings to Pinecone
 *    - Stores vectors with metadata (name, type, filepath)
 *    - Enables semantic similarity search
 *    - Uses user's session ID as namespace for isolation
 *
 * Error handling:
 * - Logs detailed error messages for debugging
 * - Propagates errors to caller for handling
 * - Does not throw on individual failures (allows batch processing)
 *
 * Performance notes:
 * - Embedding generation is the bottleneck (OpenAI API calls)
 * - Consider rate limiting if processing many files
 * - Operations can happen asynchronously after HTTP response
 *
 * @async
 * @param {string} filePath - Absolute path to the JavaScript file to process
 * @returns {Promise<void>} Resolves when file is fully processed and stored
 * @throws {Error} If parsing fails or critical errors occur
 *
 * @example
 * // Process a single file
 * await processFile('/absolute/path/to/src/utils.js');
 *
 * // Handle processing in a directory traversal
 * fs.readdirSync(dir).forEach(file => {
 *   if (file.endsWith('.js')) {
 *     processFile(path.join(dir, file)).catch(err =>
 *       console.error(`Failed to process ${file}:`, err)
 *     );
 *   }
 * });
 */
export async function processFile(filePath) {
  try {
    console.log(`Processing file: ${filePath}`);

    // Step 1: Extract code blocks using Tree-Sitter AST parser
    const codeBlocks = await parseCodeFile(filePath);

    // Step 2: Generate embeddings for extracted code segments
    const embeddedCodeBlocks = await processAndUpdateDictionary(codeBlocks);
    console.log(
      `Generated ${embeddedCodeBlocks.functions.length} function embeddings, ` +
        `${embeddedCodeBlocks.classes.length} class embeddings, ` +
        `${embeddedCodeBlocks.comments?.length || 0} comment embeddings, and ` +
        `${embeddedCodeBlocks.variables?.length || 0} variable embeddings`,
    );

    // Step 3: Upsert the embeddings into Pinecone vector database
    await pinecone.upsertEmbeddings(embeddedCodeBlocks);
    console.log("✓ Embeddings successfully upserted to Pinecone");
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    throw error;
  }
}
