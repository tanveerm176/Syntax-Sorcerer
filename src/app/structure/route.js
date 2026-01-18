/**
 * Codebase Structure Route Handler
 *
 * Returns the directory structure of the uploaded codebase
 * Used by the frontend to display the project tree view
 *
 * Endpoint: GET /api/structure
 *
 * Response:
 * {
 *   "structure": [
 *     {
 *       "name": "src",
 *       "type": "directory",
 *       "path": "src",
 *       "children": [...]
 *     },
 *     ...
 *   ]
 * } or
 * {
 *   "error": "error message"
 * }
 *
 * @module structureRoute
 */
import fs from "fs";
import fsp from "fs/promises";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";

/**
 * Recursively builds a tree structure of the codebase
 *
 * @async
 * @param {string} dirPath - The directory path to read
 * @param {string} relativePath - The relative path for display
 * @returns {Promise<Array>} Array of file/folder objects with children
 */
async function buildDirectoryTree(dirPath, relativePath = "") {
  const entries = [];

  try {
    const items = await fsp.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      // Skip hidden files and common ignore patterns
      if (
        item.name.startsWith(".") ||
        item.name === "node_modules" ||
        item.name === "undefined"
      ) {
        continue;
      }

      const itemPath = path.join(dirPath, item.name);
      const relItemPath = relativePath
        ? `${relativePath}/${item.name}`
        : item.name;

      if (item.isDirectory()) {
        const children = await buildDirectoryTree(itemPath, relItemPath);
        entries.push({
          name: item.name,
          type: "directory",
          path: relItemPath,
          children,
        });
      } else {
        entries.push({
          name: item.name,
          type: "file",
          path: relItemPath,
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return entries;
}

/**
 * Gets the directory structure of the current codebase
 *
 * @async
 * @param {Request} request - Next.js GET request object
 * @returns {Promise<NextResponse>} JSON response with directory tree
 */
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const seed = cookieStore.get("seed")?.value;

    if (!seed) {
      return NextResponse.json({ error: "No active session" }, { status: 400 });
    }

    // Get the codebase directory for this session
    const codebaseDir = path.join(
      process.cwd(),
      "undefined",
      `codebase${seed}`,
    );

    // Check if codebase exists
    if (!fs.existsSync(codebaseDir)) {
      return NextResponse.json(
        { error: "No codebase found for this session" },
        { status: 404 },
      );
    }

    // Build the directory tree
    const structure = await buildDirectoryTree(codebaseDir);

    return NextResponse.json({
      structure,
    });
  } catch (error) {
    console.error("Error getting codebase structure:", error);
    return NextResponse.json(
      { error: "Failed to get codebase structure" },
      { status: 500 },
    );
  }
}
