import { createClient } from "redis";
import log from "@/utils/logger.js";

// Build Redis connection configuration (including TLS detection)
const buildRedisConfig = () => {
  const host = process.env.REDIS_HOST ?? "localhost";
  const port = process.env.REDIS_PORT ?? "6379";
  const username = process.env.REDIS_USERNAME ?? "default";
  const password = process.env.REDIS_PASSWORD ?? "";

  // Heuristic: AWS ElastiCache Serverless (Valkey/Redis) requires TLS in-transit.
  // Detect by host suffix OR explicit env flag.
  const explicitlyTls = (process.env.REDIS_TLS ?? "").toLowerCase() === "true";
  const looksLikeAwsCache = /\.cache\.amazonaws\.com$/i.test(host);
  const isTls = explicitlyTls || looksLikeAwsCache;

  // Log the environment variables for debugging (mask secrets)
  log.debug(
    {
      REDIS_HOST: host,
      REDIS_PORT: port,
      REDIS_USERNAME: username,
      REDIS_PASSWORD: password ? "***" : "(not set)",
      REDIS_TLS: isTls,
    },
    "Redis configuration from environment",
  );

  const scheme = isTls ? "rediss" : "redis";

  // Construct URL with credentials
  let url: string;
  if (password) {
    // URL-encode the username and password to handle special characters
    const encodedUsername = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password);
    url = `${scheme}://${encodedUsername}:${encodedPassword}@${host}:${port}`;
  } else {
    url = `${scheme}://${host}:${port}`;
  }

  return { url, host, isTls } as const;
};

// Create client only when needed, not at module load time
let redisClient: ReturnType<typeof createClient> | null = null;

const getRedisClient = () => {
  if (!redisClient) {
    const { url: redisUrl, host, isTls } = buildRedisConfig();
    // Mask password in logged URL for security
    const maskedRedisUrl = redisUrl.replace(/:([^@]+)@/, ":***@");
    log.info(
      {
        url: maskedRedisUrl,
        tls: isTls,
      },
      "Creating Redis client",
    );

    redisClient = createClient({
      url: redisUrl,
      socket: isTls
        ? {
            tls: true,
            servername: host, // ensure SNI matches AWS certificate CN
          }
        : undefined,
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

  // If already ready, we're good
  if (client.isReady) {
    log.debug("Redis Client: Already ready");
    return true;
  }

  // If connection is open but not yet ready, wait for readiness
  if (client.isOpen && !client.isReady) {
    log.info("Redis Client: Connection open, waiting for ready...");
    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = (err: unknown) => {
        cleanup();
        reject(err);
      };
      const cleanup = () => {
        client.off("ready", onReady);
        client.off("error", onError);
      };
      client.once("ready", onReady);
      client.once("error", onError);
    });
    log.info("Redis Client: Became ready");
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
