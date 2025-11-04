import { createClient } from "redis";
import log from "../../utils/logger.js";

// Build Redis URL from environment variables
const buildRedisUrl = () => {
  const host = process.env.REDIS_HOST ?? "localhost";
  const port = process.env.REDIS_PORT ?? "6379";
  const username = process.env.REDIS_USERNAME ?? "default";
  const password = process.env.REDIS_PASSWORD ?? "";

  // Log the environment variables for debugging
  log.debug(
    {
      REDIS_HOST: host,
      REDIS_PORT: port,
      REDIS_USERNAME: username,
      REDIS_PASSWORD: password ? "***" : "(not set)",
    },
    "Redis configuration from environment",
  );

  // Construct URL with credentials
  if (password) {
    return `redis://${username}:${password}@${host}:${port}`;
  }
  return `redis://${host}:${port}`;
};

const redisUrl = buildRedisUrl();
// Mask password in logged URL for security
const maskedRedisUrl = redisUrl.replace(/:([^@]+)@/, ":***@");
log.info(`Attempting to connect to Redis at: ${maskedRedisUrl}`);
export const redisClient = createClient({
  url: redisUrl,
});

// Add detailed logging for all Redis client events
redisClient.on("error", (err) => {
  log.error(
    {
      code: err.code,
      errno: err.errno,
      syscall: err.syscall,
      address: err.address,
      port: err.port,
      message: err.message,
      stack: err.stack,
    },
    "Redis Client Error",
  );
});

redisClient.on("connect", () => {
  log.info("Redis Client: Connected");
});

redisClient.on("ready", () => {
  log.info("Redis Client: Ready");
});

redisClient.on("reconnecting", () => {
  log.warn("Redis Client: Reconnecting...");
});

redisClient.on("warning", (warning) => {
  log.warn({ warning }, "Redis Client Warning");
});

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    try {
      log.info("Redis Client: Attempting connection...");
      await redisClient.connect();
      log.info("Redis Client connection established successfully");
      return true;
    } catch (error) {
      log.error(
        {
          error,
          message: error instanceof Error ? error.message : String(error),
        },
        "Redis Client: Failed to connect",
      );
      throw error;
    }
  } else {
    log.debug("Redis Client: Already connected, skipping");
  }
};

export const disconnectRedis = async () => {
  if (redisClient.isOpen) {
    try {
      log.info("Redis Client: Attempting disconnection...");
      await redisClient.quit();
      log.info("Redis Client disconnected successfully");
    } catch (error) {
      log.error(
        {
          error,
          message: error instanceof Error ? error.message : String(error),
        },
        "Redis Client: Error during disconnection",
      );
      throw error;
    }
  } else {
    log.debug("Redis Client: Already disconnected, skipping");
  }
};
