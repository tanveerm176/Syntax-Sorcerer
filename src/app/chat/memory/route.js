/**
 * Chat Memory Initialization Route Handler
 *
 * Initializes Redis chat history storage for a new user session.
 * Checks if chat history exists for the session, and creates it if needed.
 *
 * Endpoint: GET /api/chat/memory
 *
 * Response:
 * {
 *   "message": "Chatbot memory initialized" or "Chatbot memory present"
 * } or
 * {
 *   "error": "Failed to initialize memory"
 * }
 *
 * @module chatMemoryRoute
 */
import { connectRedis } from "@/app/config/redisConfig";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Initializes or checks chat history for the current user session
 *
 * Flow:
 * 1. Connect to Redis
 * 2. Get session ID from cookies
 * 3. Check if chat history list exists for this session
 * 4. Create list if it doesn't exist (with a starting marker)
 * 5. Return status message
 *
 * Redis key pattern: `{seed}_chats`
 * - "Start of messages" is a placeholder to ensure the list exists
 * - It's removed when the first real message is stored
 *
 * @async
 * @param {Request} request - Next.js request object
 * @returns {Promise<NextResponse>} JSON response with memory status
 *
 * @example
 * // Request
 * GET /api/chat/memory
 *
 * // Response (first call)
 * { "message": "Chatbot memory initialized" }
 *
 * // Response (subsequent calls)
 * { "message": "Chatbot memory present" }
 */
export async function GET(request) {
  try {
    // Connect to Redis database
    const client = await connectRedis();
    const cookieStore = cookies();
    const seed = cookieStore.get("seed");

    // Check if chat history list exists for this user
    let chatExists = await client.exists(`${seed}_chats`);

    // Create a list of messages for this user session if not created already
    if (!chatExists) {
      // Initialize with a placeholder message
      await client.lPush(`${seed}_chats`, "Start of messages");
      return NextResponse.json({ message: "Chatbot memory initialized" });
    } else {
      // Chat history already exists for this session
      return NextResponse.json({ message: "Chatbot memory present" });
    }
  } catch (error) {
    console.error("Error initializing chat memory:", error);
    return NextResponse.json(
      { error: "Failed to initialize memory" },
      { status: 500 },
    );
  }
}
