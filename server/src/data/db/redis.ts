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
    // URL-encode the username and password to handle special characters
    const encodedUsername = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password);
    return `redis://${encodedUsername}:${encodedPassword}@${host}:${port}`;
  }
  return `redis://${host}:${port}`;
};

// Create client only when needed, not at module load time
let redisClient: ReturnType<typeof createClient> | null = null;

const getRedisClient = () => {
  if (!redisClient) {
    const redisUrl = buildRedisUrl();
    // Mask password in logged URL for security
    const maskedRedisUrl = redisUrl.replace(/:([^@]+)@/, ":***@");
    log.info(`Creating Redis client for: ${maskedRedisUrl}`);

    redisClient = createClient({
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
  }
  return redisClient;
};

export const connectRedis = async () => {
  const client = getRedisClient();

  if (client.isOpen) {
    log.debug("Redis Client: Already connected");
    return true;
  }

  try {
    log.info("Redis Client: Attempting connection...");
    await client.connect();
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
};

export const disconnectRedis = async () => {
  if (!redisClient || !redisClient.isOpen) {
    log.debug("Redis Client: Already disconnected or not initialized");
    return;
  }

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
};

// Export the client getter for direct access
export const getRedisClientInstance = () => {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return redisClient;
};
