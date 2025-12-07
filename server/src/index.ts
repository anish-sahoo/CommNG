import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { auth } from "./auth.js";
import { allowedOrigins } from "./cors.js";
import { connectRedis, getRedisClientInstance } from "./data/db/redis.js";
import { connectPostgres } from "./data/db/sql.js";
import { policyEngine } from "./service/policy-engine.js";
import { appRouter } from "./trpc/app_router.js";
import { openApiDocument } from "./trpc/openapi.js";
import { createContext } from "./trpc/trpc.js";
import log from "./utils/logger.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or same-origin)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (
        allowedOrigins.some((allowed) => origin.startsWith(allowed as string))
      ) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // allow cookies/authorization headers
  }),
);

app.use("/api/auth", toNodeHandler(auth));

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// This is what swagger hits
app.use(
  "/api/openapi",
  createOpenApiExpressMiddleware({ router: appRouter, createContext }),
);

// OpenAPI swagger docs
app.use("/api/docs", swaggerUi.serve);
app.get("/api/docs/openapi", swaggerUi.setup(openApiDocument));

// Track connection status for health checks
let isPostgresConnected = false;
let isRedisConnected = false;

// Health check endpoint for ALB
app.get("/api/health", (_req, res) => {
  // During startup, allow health checks to pass even if DB isn't ready
  // This prevents ECS from killing the task during initialization
  if (!isPostgresConnected || !isRedisConnected) {
    log.warn("Health check: Connections still initializing");
    return res.status(200).json({
      status: "initializing",
      db: {
        postgres: isPostgresConnected,
        redis: isRedisConnected,
      },
      timestamp: new Date().toISOString(),
      image: process.env.IMAGE_TAG || "unknown",
    });
  }

  res.status(200).json({
    status: "healthy",
    db: {
      postgres: isPostgresConnected,
      redis: isRedisConnected,
    },
    timestamp: new Date().toISOString(),
    image: process.env.IMAGE_TAG || "unknown",
  });
});

// Flush Redis endpoint
// TODO: remove this later
app.get("/api/flush-redis", async (_req, res) => {
  try {
    const client = getRedisClientInstance();
    await client.flushAll();
    res.status(200).json({ success: true });
  } catch (error) {
    log.error({ error }, "Failed to flush Redis");
    res.status(500).json({ success: false, error: "Failed to flush Redis" });
  }
});

// Start the Express server first so health checks can pass
app.listen(port, () => {
  log.info(`tRPC server running at http://localhost:${port}/api/trpc`);
  log.info(`Better auth running at http://localhost:${port}/api/auth`);
});

// Connect to databases asynchronously after server is listening
(async () => {
  try {
    await connectPostgres();
    isPostgresConnected = true;
    log.info("Postgres connection marked as healthy");

    await connectRedis();
    isRedisConnected = true;
    log.info("Redis connection marked as healthy");

    // Populate policy cache after all connections are ready
    await policyEngine.populateCache(60 * 60 * 12, 5000);
  } catch (error) {
    log.error({ error }, "Failed to initialize connections");
    // Don't exit - let the health check eventually fail if needed
  }
})();
