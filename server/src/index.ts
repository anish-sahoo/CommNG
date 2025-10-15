import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import { auth } from "./auth.js";
import { connectRedis } from "./data/db/redis.js";
import { connectPostgres } from "./data/db/sql.js";
import { policyEngine } from "./service/policy-engine.js";
import { appRouter } from "./trpc/app_router.js";
import log from "./utils/logger.js";
import { registerTrpcUiRoute } from "./utils/trpc-ui.js";
import { createContext } from "./trpc/trpc.js";

config({ path: "../env" });

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());

app.all("/api/auth/*", toNodeHandler(auth));

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

await connectPostgres();
await connectRedis();
await policyEngine.populateCache(60 * 60 * 12, 5000);

if (process.env.NODE_ENV !== "production" || process.env.TRPC_UI === "true") {
  registerTrpcUiRoute(app, appRouter, port);
  log.info(`tRPC UI running at http://localhost:${port}/trpc-ui`);
}

app.listen(port, () => {
  log.info(`tRPC server running at http://localhost:${port}/api/trpc`);
});
