/**
 * Codebase Deletion Route Handler
 *
 * Handles removal of an uploaded codebase and all associated data.
 * Cleans up both filesystem and Pinecone vector database.
 *
 * Endpoint: GET /api/delete
 *
 * Response:
 * {
 *   "message": "Codebase deleted"
 * } or
 * {
 *   "error": "error message"
 * }
 *
 * Operations performed:
 * 1. Check if codebase directory exists for this session
 * 2. Delete entire codebase directory from filesystem
 * 3. Clear all vectors from the Pinecone namespace
 * 4. Return success/error response
 *
 * @module deleteCodebaseRoute
 */
import fs from "fs";
import fsp from "fs/promises";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";
import { pinecone } from "../config/pinecone/pineconeInit";

/**
 * Deletes the currently uploaded codebase and all associated vector embeddings
 *
 * This is a destructive operation that:
 * 1. Removes all codebase files from the server
 * 2. Clears all Pinecone embeddings for this user's session
 *
 * The codebase directory path is: `{CODEBASE_DIR}/codebase{seed}`
 * where seed is the user's session identifier from cookies
 *
 * @async
 * @param {Request} request - Next.js GET request object
 * @returns {Promise<NextResponse>} JSON response indicating success or error
 *
 * @example
 * // Request
 * GET /api/delete
 *
 * // Response (success)
 * { "message": "Codebase deleted" }
 *
 * // Response (error - no codebase)
 * { "error": "No codebase currently uploaded", "status": 400 }
 */
export async function GET(request) {
  const codebasePath = path.join(
    `${process.env.NEXT_PUBLIC_CODEBASE_DIR}`,
    `codebase${cookies().get("seed").value}`,
  );

  // Check if codebase exists before attempting deletion
  if (!fs.existsSync(codebasePath)) {
    return NextResponse.json(
      { error: "No codebase currently uploaded" },
      { status: 400 },
    );
  }

  try {
    // Delete the codebase directory and all files recursively
    await fsp.rm(codebasePath, { recursive: true, force: true });

    // Delete all vectors from the Pinecone namespace for this session
    await pinecone.deleteVectorsFromNamespace();

    return NextResponse.json({ message: "Codebase deleted" });
  } catch (error) {
    console.error("Failed to delete codebase:", error);
    return NextResponse.json(
      { error: `Failed to delete codebase` },
      { status: 500 },
    );
  }
}
