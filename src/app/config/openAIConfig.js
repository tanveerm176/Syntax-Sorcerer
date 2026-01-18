/**
 * OpenAI Configuration Module
 *
 * Initializes and exports a configured OpenAI client instance.
 * The API key is loaded from the OPENAI_API_KEY environment variable.
 *
 * This module should be imported wherever OpenAI API calls are needed
 * (embedding generation, chat completions, etc.)
 *
 * @module openAIConfig
 * @exports {OpenAI} openai - Configured OpenAI client instance
 *
 * @throws {Error} If OPENAI_API_KEY environment variable is not set
 */
import OpenAI from "openai";

/**
 * Configured OpenAI client instance
 * Uses text-embedding-ada-002 for embeddings and gpt-3.5-turbo for chat completions
 * @type {OpenAI}
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
