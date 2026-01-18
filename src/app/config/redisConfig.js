import { createClient } from "redis";

export const client = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "19829"),
  },
});

export async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}
