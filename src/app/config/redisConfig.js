/**
 * Redis Configuration Module
 *
 * Initializes and manages a Redis client for storing chat history and session data.
 * The client uses the following environment variables for configuration:
 * - REDIS_PASSWORD: Password for Redis authentication
 * - REDIS_HOST: Redis server hostname
 * - REDIS_PORT: Redis server port (defaults to 19829)
 *
 * This module provides a lazy connection pattern that only connects when needed.
 *
 * @module redisConfig
 */
import { createClient } from "redis";

/**
 * Redis client instance (not connected until connectRedis is called)
 * Configured with:
 * - Default username
 * - Password from environment variable
 * - Host and port from environment variables
 *
 * @type {RedisClient}
 */
export const client = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "19829"),
  },
});

/**
 * Establishes connection to Redis if not already connected
 * Safe to call multiple times - only creates one connection
 *
 * Used for storing:
 * - Chat history (Redis lists with pattern: `{seed}_chats`)
 * - Session state and temporary data
 *
 * @async
 * @returns {Promise<RedisClient>} Connected Redis client instance
 * @throws {Error} If connection fails
 *
 * @example
 * const client = await connectRedis();
 * const messages = await client.lRange('seed123_chats', 0, -1);
 */
export async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}
