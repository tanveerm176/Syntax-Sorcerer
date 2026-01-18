/**
 * Codebase Status Check Route Handler
 *
 * Checks whether an active codebase exists for the current user session.
 * Used by the frontend to display codebase status indicator.
 *
 * Endpoint: GET /api/status
 *
 * Response:
 * {
 *   "active": true/false,
 *   "seed": "user-session-id"
 * }
 *
 * @module statusRoute
 */
import fs from "fs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";

/**
 * Checks if an active codebase exists for the current user session
 *
 * @async
 * @param {Request} request - Next.js GET request object
 * @returns {Promise<NextResponse>} JSON response with active status and seed
 */
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const seed = cookieStore.get("seed")?.value;

    if (!seed) {
      return NextResponse.json({
        active: false,
        seed: null,
      });
    }

    // Check if codebase directory exists for this session
    const codebaseDir = path.join(
      process.cwd(),
      "undefined",
      `codebase${seed}`,
    );
    const exists = fs.existsSync(codebaseDir);

    return NextResponse.json({
      active: exists,
      seed: seed,
    });
  } catch (error) {
    console.error("Error checking codebase status:", error);
    return NextResponse.json(
      { error: "Failed to check codebase status" },
      { status: 500 },
    );
  }
}
