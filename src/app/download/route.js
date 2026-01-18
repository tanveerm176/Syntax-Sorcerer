/**
 * Codebase Download and Processing Route Handler
 *
 * Handles downloading a codebase ZIP file from a URL, extracting it,
 * parsing JavaScript files, generating embeddings, and storing them in Pinecone.
 *
 * Endpoint: POST /api/download
 *
 * Request body:
 * {
 *   "url": "https://github.com/user/repo/archive/refs/heads/main.zip"
 * }
 *
 * Response:
 * {
 *   "message": "Codebase downloaded and extracted",
 *   "path": "/path/to/extracted/codebase"
 * } or
 * {
 *   "error": "error message"
 * }
 *
 * Processing flow:
 * 1. Validate URL and check if codebase already exists
 * 2. Download ZIP file from URL
 * 3. Extract ZIP to filesystem
 * 4. Recursively process all JavaScript files
 * 5. Extract functions and classes using Tree-Sitter parser
 * 6. Generate embeddings for each code element
 * 7. Upsert embeddings to Pinecone
 *
 * @module downloadCodebaseRoute
 */
import AdmZip from "adm-zip";
import axios from "axios";
import fs from "fs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";
import { processFile } from "../database/processFile";

/**
 * Downloads a ZIP archive from a URL, extracts it, and processes all code files
 *
 * Steps:
 * 1. Check if a codebase already exists for this session (prevents overwriting)
 * 2. Validate URL is provided and not empty
 * 3. Download ZIP file using axios
 * 4. Extract ZIP contents to the codebase directory
 * 5. Recursively traverse directory tree
 * 6. For each JavaScript file, call processFile() to:
 *    - Parse code with Tree-Sitter AST parser
 *    - Generate embeddings with OpenAI
 *    - Upload to Pinecone vector database
 *
 * The processing happens asynchronously after the route responds,
 * so the user gets immediate feedback while processing continues.
 *
 * Codebase directory structure:
 * {CODEBASE_DIR}/codebase{seed}/{project-name}/[source files]
 *
 * @async
 * @param {Request} request - Next.js POST request with {url} in body
 * @returns {Promise<NextResponse>} JSON response with path or error
 *
 * @example
 * // Request
 * POST /api/download
 * { "url": "https://github.com/user/repo/archive/main.zip" }
 *
 * // Response
 * {
 *   "message": "Codebase downloaded and extracted",
 *   "path": "/full/path/to/codebase/project-name"
 * }
 */
export async function POST(request) {
  const { url } = await request.json();

  // Construct path for this user's codebase
  const codebasePath = path.join(
    `${process.env.NEXT_PUBLIC_CODEBASE_DIR}`,
    `codebase${cookies().get("seed").value}`,
  );

  // Check if codebase already exists for this user
  if (fs.existsSync(codebasePath)) {
    return NextResponse.json(
      { error: "Codebase already uploaded; delete it to upload another" },
      { status: 400 },
    );
  }

  if (!url || url == "") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // Download ZIP file from the provided URL
    const response = await axios({
      url,
      method: "GET",
      responseType: "arraybuffer", // Binary data for ZIP file
    });

    // Extract ZIP file
    const zip = new AdmZip(response.data);
    const extractPath = path.join(
      `${process.env.NEXT_PUBLIC_CODEBASE_DIR}`,
      `codebase${cookies().get("seed").value}`,
      path.basename(url, ".zip"), // Use URL name as directory name
    );
    zip.extractAllTo(extractPath, true);

    // Asynchronously process all JavaScript files in the codebase
    // This continues in the background after the response is sent
    const traverseDirectory = (directoryPath) => {
      fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
        if (err) {
          console.error(`Failed to read codebase directory: ${err}`);
          return;
        }

        files.forEach((file) => {
          const filePath = path.join(directoryPath, file.name);

          if (file.isDirectory()) {
            // Recursively traverse subdirectories
            traverseDirectory(filePath);
          } else if (file.isFile()) {
            // Check if file is JavaScript and process it
            if (
              filePath.endsWith(".js") ||
              filePath.endsWith(".jsx") ||
              filePath.endsWith(".ts") ||
              filePath.endsWith(".tsx")
            ) {
              processFile(filePath).catch((err) =>
                console.error(`Error processing ${filePath}:`, err),
              );
            }
          }
        });
      });
    };

    // Start background directory traversal and file processing
    traverseDirectory(codebasePath);

    return NextResponse.json({
      message: "Codebase downloaded and extracted",
      path: extractPath,
    });
  } catch (error) {
    console.error("Failed to download codebase:", error);
    return NextResponse.json({ error: `Failed to download codebase` });
  }
}
