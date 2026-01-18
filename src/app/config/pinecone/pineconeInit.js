/**
 * Pinecone Initialization Module
 *
 * Creates and exports a PineconeManager instance for managing vector embeddings
 * in the "syntaxsorcerer" Pinecone index.
 *
 * The PineconeManager handles:
 * - Index creation and initialization
 * - Upserting code embeddings (functions and classes)
 * - Similarity search for semantic code queries
 * - Index cleanup and vector deletion
 *
 * Requires PINECONE_API_KEY environment variable to be set.
 *
 * @module pineconeInit
 * @exports {PineconeManager} pinecone - Initialized PineconeManager instance
 */
import { PineconeManager } from "./pineconeManager";

/**
 * Global Pinecone manager instance for the "syntaxsorcerer" index
 *
 * This instance is reused throughout the application for all Pinecone operations.
 * Vector dimension: 1536 (OpenAI text-embedding-ada-002)
 * Similarity metric: cosine
 *
 * @type {PineconeManager}
 */
export const pinecone = new PineconeManager(
  process.env.PINECONE_API_KEY,
  "syntaxsorcerer",
);
