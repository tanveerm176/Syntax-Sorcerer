/**
 * Chat API Route Handler
 *
 * Handles POST requests to send messages to OpenAI's ChatGPT API.
 * Maintains conversation history in Redis for context-aware responses.
 * Automatically manages chat history to stay within token limits.
 *
 * Endpoint: POST /api/chat
 *
 * Request body:
 * {
 *   "prompt": "user message here"
 * }
 *
 * Response:
 * {
 *   "text": "ChatGPT response here"
 * } or
 * {
 *   "error": "error message"
 * }
 *
 * @module chatRoute
 */
import { connectRedis } from "@/app/config/redisConfig";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { openai } from "../config/openAIConfig";

/**
 * Sends a message to ChatGPT API and stores the conversation in Redis
 *
 * Flow:
 * 1. Extract user prompt from request
 * 2. Retrieve chat history from Redis (limited to 6 messages max)
 * 3. Send prompt + history to ChatGPT
 * 4. Store user message and AI response in Redis
 * 5. Return AI response to client
 *
 * Chat history management:
 * - Maintains up to 6 messages per conversation
 * - Removes oldest messages when limit exceeded
 * - Uses Redis list with pattern: `{seed}_chats`
 *
 * @async
 * @param {Request} request - Next.js request object containing {prompt}
 * @returns {Promise<NextResponse>} JSON response with ChatGPT message or error
 *
 * @example
 * // Request
 * POST /chat
 * { "prompt": "How do I use this codebase?" }
 *
 * // Response
 * { "text": "You can start by looking at the main entry point..." }
 */
export async function POST(request) {
  const res = await request.json();
  const userInput = res.prompt;

  if (!userInput) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "API key is missing" }, { status: 500 });
  }

  // Get user's session ID from cookies
  const cookieStore = cookies();
  const seed = cookieStore.get("seed");
  let chatHistory = "";

  try {
    // Connect to Redis and retrieve previous messages for this user session
    const client = await connectRedis();
    const chats = await client.lRange(`${seed}_chats`, 0, -1);

    // Build chat history string for context
    // Skip the starting message, since you can't have an empty Redis list
    if (chats.length > 1) {
      for (let i = 0; i < chats.length; i++) {
        chatHistory = chatHistory.concat(chats[i] + "\n");
      }
    }

    // Send request to ChatGPT with context from chat history
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        // System message with chat history for context
        {
          role: "system",
          content:
            "You are a Socratic teacher helping students learn programming and code concepts. Your role is to guide students to discover answers themselves through thoughtful questioning, not by providing direct solutions. " +
            "\n\nSocratic Teaching Guidelines:" +
            "\n- Ask clarifying questions to understand what the student knows" +
            "\n- Break complex problems into smaller, manageable questions" +
            "\n- Guide them toward the answer with leading questions" +
            "\n- Praise effort and reasoning, even if incorrect" +
            "\n- If they're stuck, provide hints rather than solutions" +
            "\n- Encourage them to explain their thinking and reasoning" +
            "\n- Point out contradictions gently to help them reconsider" +
            "\n- Use analogies or simpler examples to build understanding" +
            "\n\nPrevious conversation for context:" +
            "\n" +
            chatHistory,
        },
        // Current user message
        { role: "user", content: userInput },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    // Store user message in Redis chat history
    await client.lPush(`${seed}_chats`, `User: ${userInput}`);

    // Remove dummy value (initial message)
    await client.lRem(`${seed}_chats`, 1, "Start of messages");

    // Extract response from ChatGPT
    const data = response.choices;

    if (data && data.length > 0 && data[0].message && data[0].message.content) {
      // Store ChatGPT response in Redis chat history
      await client.lPush(
        `${seed}_chats`,
        `Assistant: ${data[0].message.content.trim()}`,
      );
    } else {
      await client.lPush(`${seed}_chats`, "Error: Something went wrong");
    }

    // Enforce chat history limit (max 6 messages)
    const chatLength = await client.lLen(`${seed}_chats`);

    if (chatLength >= 6) {
      // Remove the oldest two chat messages to maintain reasonable context window
      for (let i = 0; i < 2; i++) {
        await client.rPop(`${seed}_chats`);
      }
    }

    // Return the ChatGPT response
    if (data && data.length > 0) {
      return NextResponse.json(
        { text: data[0].message.content.trim() },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { error: "Invalid response from API" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
