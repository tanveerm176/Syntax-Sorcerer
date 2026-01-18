/**
 * Pinecone Vector Database Manager Class
 *
 * Encapsulates all operations for managing vector embeddings in Pinecone:
 * - Index creation and initialization
 * - Upserting code embeddings (functions and classes)
 * - Semantic similarity search for code snippets
 * - Namespace management for multi-user isolation
 * - Index and namespace cleanup
 *
 * Architecture:
 * - One index per Pinecone project ("syntaxsorcerer")
 * - One namespace per user session (identified by cookie seed)
 * - Vector dimension: 1536 (OpenAI text-embedding-ada-002)
 * - Similarity metric: cosine distance
 * - Serverless deployment on AWS
 *
 * Usage flow:
 * 1. Initialize manager with API key and index name
 * 2. Upsert embeddings when files are processed
 * 3. Perform similarity searches for user queries
 * 4. Delete namespace when codebase is removed
 *
 * @module pineconeManager
 * @class PineconeManager
 */
import { Pinecone } from "@pinecone-database/pinecone";
import { cookies } from "next/headers";

/**
 * PineconeManager class for managing Pinecone vector database operations
 *
 * Provides a wrapper around the Pinecone SDK with application-specific logic
 * for code search and embedding management.
 */
export class PineconeManager {
  /**
   * Constructs a new PineconeManager instance
   *
   * Creates a Pinecone client and stores configuration. The index is not created
   * immediately - call initPinecone() to create it on the server.
   *
   * @param {string} apiKey - The API key for Pinecone authentication
   * @param {string} indexName - The name of the Pinecone index (e.g., "syntaxsorcerer")
   * @param {number} [dimension=1536] - Vector dimension (must match embedding model)
   *                                    1536 for OpenAI text-embedding-ada-002
   * @param {string} [metric="cosine"] - Similarity metric for search
   *                                     "cosine", "euclidean", or "dotproduct"
   * @param {string} [cloud="aws"] - Cloud provider for serverless spec
   * @param {string} [region="us-east-1"] - Cloud region for the index
   */
  constructor(
    apiKey,
    indexName,
    dimension = 1536,
    metric = "cosine",
    cloud = "aws",
    region = "us-east-1",
  ) {
    this.pc = new Pinecone({ apiKey });
    this.indexName = indexName;
    this.dimension = dimension;
    this.metric = metric;
    this.cloud = cloud;
    this.region = region;
    this.index = this.pc.index(indexName);
  }

  /**
   * Creates a promise-based delay
   *
   * Used to wait for index initialization or consistency after operations.
   * Pinecone sometimes needs a delay after index creation before it's ready.
   *
   * @param {number} ms - Delay duration in milliseconds
   * @returns {Promise<void>} Resolves after the specified delay
   * @private
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Initializes the Pinecone index with the configured settings
   *
   * Creates a new index on the Pinecone server if it doesn't exist.
   * After creation, reinitializes the local index reference and waits
   * 3 seconds for the index to be ready before returning.
   *
   * Important: Only call this once during application startup or when
   * explicitly needed. Calling multiple times may cause errors.
   *
   * Configuration:
   * - Uses serverless spec for auto-scaling
   * - Deploys to AWS in specified region
   * - Configures cosine similarity metric
   * - Sets vector dimension to 1536
   *
   * @async
   * @returns {Promise<void>} Resolves when index is fully initialized and ready
   * @throws {Error} If index creation fails or API key is invalid
   *
   * @example
   * const manager = new PineconeManager(apiKey, 'syntaxsorcerer');
   * await manager.initPinecone(); // Create and initialize the index
   */
  async initPinecone() {
    await this.pc.createIndex({
      name: this.indexName,
      dimension: this.dimension,
      metric: this.metric,
      spec: {
        serverless: {
          cloud: this.cloud,
          region: this.region,
        },
      },
    });

    // Reinitialize index reference after creation
    this.index = this.pc.index(this.indexName);
    // Wait for index to be ready
    await this.delay(3000);
  }

  /**
   * Upserts (uploads or updates) code embeddings into Pinecone
   *
   * Takes extracted code elements with embeddings and stores them in Pinecone.
   * Each code element becomes a vector in the specified namespace.
   *
   * Payload structure for each element:
   * - id: function/class name (used for retrieval)
   * - values: 1536-dimensional embedding vector
   * - metadata: {filepath, type} for filtering and context
   *
   * Namespaces isolate user codebases - each user gets a namespace
   * based on their session ID (seed from cookies).
   *
   * @async
   * @param {Object} data - Code elements with embeddings
   * @param {Array} data.functions - Array of function objects with:
   *                                {code, function_name, filepath, embedding}
   * @param {Array} data.classes - Array of class objects with:
   *                              {code, class_name, filepath, embedding}
   * @param {string} [namespace] - Pinecone namespace (defaults to user session ID)
   * @returns {Promise<void>} Resolves when all embeddings are stored
   * @throws {Error} If upsert operation fails
   *
   * @example
   * const codeData = {
   *   functions: [{
   *     function_name: 'authenticate',
   *     filepath: 'src/auth.js',
   *     embedding: [0.123, -0.456, ...] // 1536 values
   *   }],
   *   classes: []
   * };
   * await manager.upsertEmbeddings(codeData);
   */
  async upsertEmbeddings(
    data,
    namespace = `codebase${cookies().get("seed").value}`,
  ) {
    // Prepare the upsert request payload with all code elements
    const upsertPayload = [];

    // Convert functions to Pinecone vectors
    data.functions.forEach((func) => {
      if (func.embedding && Array.isArray(func.embedding)) {
        upsertPayload.push({
          id: func.function_name, // Use function name as unique ID
          values: func.embedding, // 1536-dimensional embedding vector
          metadata: {
            filepath: func.filepath, // Path for retrieval
            type: "function", // Element type for search results
          },
        });
      }
    });

    // Convert classes to Pinecone vectors
    data.classes.forEach((cls) => {
      if (cls.embedding && Array.isArray(cls.embedding)) {
        upsertPayload.push({
          id: cls.class_name, // Use class name as unique ID
          values: cls.embedding, // 1536-dimensional embedding vector
          metadata: {
            filepath: cls.filepath, // Path for retrieval
            type: "class", // Element type for search results
          },
        });
      }
    });

    // Upload all vectors to Pinecone in the specified namespace
    await this.index.namespace(namespace).upsert(upsertPayload);
    // Wait for consistency after upsert
    await this.delay(3000);
    console.log("Embeddings upserted successfully.");
  }

  /**
   * Performs semantic similarity search in Pinecone
   *
   * Takes a query embedding and finds the most semantically similar code.
   * Returns both the similarity scores and metadata for retrieval.
   *
   * The search uses cosine similarity in the 1536-dimensional space created
   * by OpenAI's text-embedding-ada-002 model.
   *
   * Results include:
   * - id: Function or class name
   * - score: Similarity score (0-1, higher is better)
   * - metadata: filepath and type for context
   * - values: The embedding vector itself
   *
   * @async
   * @param {Array<number>} embedding - Query embedding (1536 dimensions)
   *                                    Generated from user query
   * @param {string} [namespace] - Pinecone namespace to search in
   *                              (defaults to user's session namespace)
   * @param {number} [topK=3] - Number of top results to return
   *                           Balance between relevance and performance
   * @returns {Promise<Object>} Query response with matches array
   *          Each match contains: id, score, metadata, values
   * @throws {Error} If query fails or namespace doesn't exist
   *
   * @example
   * const queryEmbedding = [0.123, -0.456, ...]; // 1536 values
   * const results = await manager.similaritySearch(queryEmbedding);
   * // Results: {matches: [{id: 'authenticate', score: 0.87, metadata: {...}}, ...]}
   */
  async similaritySearch(
    embedding,
    namespace = `codebase${cookies().get("seed").value}`,
    topK = 3,
  ) {
    const queryResponse = await this.index.namespace(namespace).query({
      vector: embedding, // Query vector for similarity search
      topK: topK, // Return top 3 most similar results
      includeValues: true, // Include embedding vectors in response
      includeMetadata: true, // Include filepath and type metadata
    });

    console.log(queryResponse.matches);

    return queryResponse;
  }

  /**
   * Deletes the entire Pinecone index
   *
   * WARNING: This is destructive and cannot be undone.
   * Deletes all namespaces and all vectors in the index.
   * Use with caution - typically called during application shutdown.
   *
   * For deleting a single user's data, use deleteVectorsFromNamespace() instead.
   *
   * @async
   * @returns {Promise<void>} Resolves when the index is deleted
   * @throws {Error} If deletion fails
   *
   * @example
   * // Only call during cleanup/uninstall
   * // await manager.clearIndex();
   */
  async clearIndex() {
    await this.pc.deleteIndex(this.indexName);
  }

  /**
   * Deletes all vectors in a specific namespace
   *
   * Removes all embeddings for a single user session.
   * Called when a user deletes their codebase.
   *
   * This is safer than clearIndex() because:
   * - Only affects one user's data
   * - Preserves the index and other namespaces
   * - Can be called per-user cleanup requests
   *
   * @async
   * @param {string} [namespace] - Namespace to clear
   *                              (defaults to user's session namespace)
   * @returns {Promise<void>} Resolves when namespace is cleared
   * @throws {Error} If deletion fails
   *
   * @example
   * // Called when user clicks "Delete Codebase" button
   * await manager.deleteVectorsFromNamespace();
   */
  async deleteVectorsFromNamespace(
    namespace = `codebase${cookies().get("seed").value}`,
  ) {
    await this.index.namespace(namespace).deleteAll();
  }
}
