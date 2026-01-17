import { parseCodeFile } from "@/lib/codeParser";
import { pinecone } from "../config/pinecone/pineconeInit";
import { processAndUpdateDictionary } from "./embeddingService";

/**
 * Process a JavaScript file: parse, generate embeddings, and store in Pinecone
 *
 * @param {string} filePath - Absolute path to the JavaScript file to process
 * @throws {Error} If parsing, embedding generation, or Pinecone operations fail
 */
export async function processFile(filePath) {
  try {
    console.log(`Processing file: ${filePath}`);

    // Extract code blocks using Tree-Sitter AST parser
    const codeBlocks = await parseCodeFile(filePath);

    // Generate embeddings for extracted code segments
    const embeddedCodeBlocks = await processAndUpdateDictionary(codeBlocks);
    console.log(
      `Generated ${embeddedCodeBlocks.functions.length} function embeddings and ${embeddedCodeBlocks.classes.length} class embeddings`,
    );

    // Upsert the embeddings into Pinecone vector database
    await pinecone.upsertEmbeddings(embeddedCodeBlocks);
    console.log("✓ Embeddings successfully upserted to Pinecone");
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    throw error;
  }
}
