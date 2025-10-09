import { createClient } from "redis";
import log from "../../utils/logger.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const password = process.env.REDIS_PASSWORD ?? "";

export const redisClient = createClient({
  url: redisUrl,
  password: password,
});

redisClient.on("error", (err) => {
  log.error(err, "Redis Client Error:");
});

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    log.info("Redis Client connection established");
  }
};

export const disconnectRedis = async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
    log.info("Redis Client disconnected");
  }
};
