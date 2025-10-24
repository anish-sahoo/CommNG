import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { auth } from "./auth.js";
import { connectRedis } from "./data/db/redis.js";
import { connectPostgres } from "./data/db/sql.js";
import { policyEngine } from "./service/policy-engine.js";
import { appRouter } from "./trpc/app_router.js";
import { createContext } from "./trpc/trpc.js";
import log from "./utils/logger.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());

app.use("/api/auth", toNodeHandler(auth));

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

app.listen(port, () => {
  log.info(`tRPC server running at http://localhost:${port}/api/trpc`);
  log.info(
    `Better-auth OpenAPI spec: http://localhost:${port}/api/auth/reference`,
  );
});
