/**
 * Semantic Code Search Route Handler
 *
 * Performs semantic similarity search on the codebase using Pinecone vector database.
 * Finds code elements most relevant to a user query through vector embeddings.
 *
 * Endpoint: POST /api/database
 *
 * Request body:
 * {
 *   "prompt": "user query here"
 * }
 *
 * Response:
 * {
 *   "text": "Description of relevant code chunks...",
 *   "files": ["file1 code...", "file2 code...", ...]
 * } or
 * {
 *   "error": "error message"
 * }
 *
 * Processing flow:
 * 1. Validate request and check codebase exists
 * 2. Generate embedding for user query
 * 3. Search Pinecone for semantically similar code
 * 4. Read full source code for matching files
 * 5. Format and return human-readable results with code
 *
 * @module databaseSearchRoute
 */
import fs from "fs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";
import { pinecone } from "../config/pinecone/pineconeInit";
import { generateEmbeddings } from "./embeddingService";
import { readCodeFromFile } from "./readCodeFromFile";

/**
 * Searches the Pinecone vector database for code semantically similar to the query
 *
 * Process:
 * 1. Verify codebase is uploaded for this session
 * 2. Convert user query to embedding using OpenAI
 * 3. Query Pinecone for vectors with highest cosine similarity
 * 4. Read full source files for matching code elements
 * 5. Build human-readable response describing matches
 * 6. Return response text and raw code files
 *
 * The search leverages:
 * - Vector similarity (cosine distance in 1536-dimensional space)
 * - Metadata (function/class name, file path, type)
 * - Similarity scores (0-1, higher is better match)
 *
 * Results are deduplicated to avoid sending the same file twice.
 *
 * @async
 * @param {Request} request - Next.js POST request with {prompt} in body
 * @returns {Promise<NextResponse>} JSON with text description and code files array
 *
 * @example
 * // Request
 * POST /api/database
 * { "prompt": "How do I authenticate users?" }
 *
 * // Response
 * {
 *   "text": "The most relevant file to your query is the function `authenticate` (from `auth/login.js`) with a score of 0.87.",
 *   "files": ["function authenticate(user, password) { ... }"]
 * }
 */
export async function POST(request) {
  const res = await request.json();
  const userInput = res.prompt;

  // Construct path for this user's codebase
  const codebasePath = path.join(
    `${process.env.NEXT_PUBLIC_CODEBASE_DIR}`,
    `codebase${cookies().get("seed").value}`,
  );

  console.log(codebasePath);

  // Validate that a codebase has been uploaded for this session
  if (!fs.existsSync(codebasePath)) {
    return NextResponse.json({
      text: "You haven't uploaded a codebase yet! Please try again.",
    });
  }

  if (!userInput) {
    return NextResponse.json({ error: "Input is required" }, { status: 400 });
  }

  if (!process.env.PINECONE_API_KEY) {
    return NextResponse.json({ error: "API key is missing" }, { status: 500 });
  }

  try {
    // Generate embedding for the user's query using OpenAI
    const embed = await generateEmbeddings(userInput);

    // Search Pinecone for semantically similar code elements
    const files = await pinecone.similaritySearch(embed);

    // Array to store actual code content from matched files
    const filesToSend = [];

    // Handle case where no relevant code is found
    if (files.matches.length == 0) {
      const answer = "No files relevant to your query could be found.";
      return NextResponse.json({ text: answer, files: filesToSend });
    }

    // Build list of relevant files with formatting
    let answer = "Here are the most relevant files to your query:\n\n";

    // Format results for each matched code element as a numbered list
    for (let i = 0; i < files.matches.length; i++) {
      // Calculate relative file path for display
      const pathOffset =
        files.matches[i].metadata.filepath.indexOf(codebasePath) + 1;
      const relativePath = files.matches[i].metadata.filepath.substring(
        codebasePath.length + pathOffset,
      );

      // Convert similarity score from decimal (0-1) to percentage (0-100%)
      const scorePercentage = Math.round(files.matches[i].score * 100);

      // Add list item with filename, type, path, and match percentage
      answer += `${i + 1}. **${files.matches[i].id}** (${files.matches[i].metadata.type})\n`;
      answer += `   📁 ${relativePath}\n`;
      answer += `   🎯 ${scorePercentage}% match\n\n`;

      // Read the actual source code from the file
      const code = await readCodeFromFile(files.matches[i].metadata.filepath);

      // Deduplicate files (don't send the same file twice)
      if (!filesToSend.includes(code)) {
        filesToSend.push(code);
      }
    }

    return NextResponse.json({ text: answer, files: filesToSend });
  } catch (error) {
    console.error("Error querying user input: ", error);
    return NextResponse.json(
      { error: `Error querying user input: ${error}` },
      { status: 500 },
    );
  }
}
