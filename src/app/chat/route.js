/**
 * Chat API Route Handler
 *
 * Handles POST requests to send messages to OpenAI's ChatGPT API.
 * Integrates semantic search with Pinecone to retrieve relevant code context.
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
import { pinecone } from "../config/pinecone/pineconeInit";
import { generateEmbeddings } from "../database/embeddingService";

/**
 * Sends a message to ChatGPT API with semantic code context and stores conversation in Redis
 *
 * Enhanced Flow:
 * 1. Extract user prompt from request
 * 2. Generate embedding for user prompt
 * 3. Search Pinecone for relevant code from student's codebase (top 3 matches)
 * 4. Retrieve chat history from Redis (limited to 6 messages max)
 * 5. Send prompt + code context + history to ChatGPT as Socratic teacher
 * 6. Store user message and AI response in Redis
 * 7. Return AI response to client
 *
 * Chat history management:
 * - Maintains up to 6 messages per conversation
 * - Removes oldest messages when limit exceeded
 * - Uses Redis list with pattern: `{seed}_chats`
 *
 * Code Context Integration:
 * - Queries Pinecone with user's prompt embedding
 * - Retrieves top 3 most relevant code snippets
 * - Uses student's actual codebase for Socratic questioning
 * - Allows teacher to ask questions about specific code patterns
 *
 * Socratic Method:
 * - System prompt guides ChatGPT to ask probing questions
 * - Code context enables targeted questioning on student's actual work
 * - Encourages discovery through questioning, not direct solutions
 *
 * @async
 * @param {Request} request - Next.js request object containing {prompt}
 * @returns {Promise<NextResponse>} JSON response with ChatGPT message or error
 *
 * @example
 * // Request
 * POST /chat
 * { "prompt": "Why am I getting an error in my parseFile function?" }
 *
 * // Response with Socratic guidance based on student's actual code
 * { "text": "I see you're working with parseFile. What error message are you seeing? Can you walk me through what parseFile is supposed to do?" }
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
  const seedCookie = cookieStore.get("seed");

  if (!seedCookie) {
    return NextResponse.json({ error: "Session not found" }, { status: 400 });
  }

  const seed = seedCookie.value;
  let chatHistory = "";
  let codeContext = "";

  try {
    // Step 1: Generate embedding for user's prompt for semantic search
    console.log("Generating embedding for user prompt...");
    const promptEmbedding = await generateEmbeddings(userInput);

    // Step 2: Query Pinecone for relevant code snippets from student's codebase
    console.log("Searching Pinecone for relevant code context...");
    let relevantCode = [];

    try {
      relevantCode = await pinecone.similaritySearch(
        promptEmbedding,
        `codebase${seed}`,
        3, // top 3 results
      );

      // Format relevant code for inclusion in system prompt
      if (
        relevantCode &&
        relevantCode.matches &&
        relevantCode.matches.length > 0
      ) {
        codeContext = relevantCode.matches
          .map((result) => {
            return (
              `File: ${result.metadata.filepath}\n` +
              `Type: ${result.metadata.type}\n` +
              `Name: ${result.id}\n` +
              `Code:\n${result.metadata.code || "N/A"}`
            );
          })
          .join("\n\n---\n\n");

        console.log(
          `Found ${relevantCode.matches.length} relevant code snippets from codebase`,
        );
      }
    } catch (pineconeError) {
      // Log but don't fail if Pinecone search fails
      console.warn(
        "Pinecone search failed, continuing without code context:",
        pineconeError.message,
      );
    }

    // Step 3: Connect to Redis and retrieve previous messages for this user session
    const client = await connectRedis();
    const chats = await client.lRange(`${seed}_chats`, 0, -1);

    // Build chat history string for context
    // Skip the starting message, since you can't have an empty Redis list
    if (chats.length > 1) {
      for (let i = 0; i < chats.length; i++) {
        chatHistory = chatHistory.concat(chats[i] + "\n");
      }
    }

    // Step 4: Build system prompt with code context
    let systemPrompt =
      "You are a Socratic teacher helping students learn programming and code concepts. Your role is to guide students to discover answers themselves through thoughtful questioning, not by providing direct solutions. " +
      "\n\nSocratic Teaching Guidelines:" +
      "\n- Ask clarifying questions to understand what the student knows" +
      "\n- Break complex problems into smaller, manageable questions" +
      "\n- Guide them toward the answer with leading questions" +
      "\n- Praise effort and reasoning, even if incorrect" +
      "\n- If they're stuck, provide hints rather than solutions" +
      "\n- Encourage them to explain their thinking and reasoning" +
      "\n- Point out contradictions gently to help them reconsider" +
      "\n- Use analogies or simpler examples to build understanding";

    // Add code context if available
    if (codeContext) {
      systemPrompt +=
        "\n\nHere is relevant code from their codebase to reference:" +
        "\n---\n" +
        codeContext +
        "\n---\n" +
        "\nUse this code context to ask targeted, Socratic questions about their actual implementation.";
    }

    // Add chat history for continuity
    if (chatHistory) {
      systemPrompt += "\n\nPrevious conversation for context:\n" + chatHistory;
    }

    // Step 5: Send request to ChatGPT with code context + chat history
    console.log("Sending prompt to ChatGPT...");
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userInput,
        },
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
      const assistantMessage = data[0].message.content.trim();
      await client.lPush(`${seed}_chats`, `Assistant: ${assistantMessage}`);

      // Enforce chat history limit (max 6 messages)
      const chatLength = await client.lLen(`${seed}_chats`);

      if (chatLength >= 6) {
        // Remove the oldest two chat messages to maintain reasonable context window
        for (let i = 0; i < 2; i++) {
          await client.rPop(`${seed}_chats`);
        }
      }

      // Return the ChatGPT response
      return NextResponse.json({ text: assistantMessage }, { status: 200 });
    } else {
      await client.lPush(`${seed}_chats`, "Error: Something went wrong");
      return NextResponse.json(
        { error: "Invalid response from API" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      {
        error: "Something went wrong",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
