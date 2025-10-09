import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import { connectRedis } from "./data/db/redis.js";
import { appRouter } from "./trpc/app_router.js";
import log from "./utils/logger.js";
import { registerTrpcUiRoute } from "./utils/trpc-ui.js";
import { connectPostgres } from "./data/db/sql.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
  }),
);

await connectPostgres();
await connectRedis();

if (process.env.NODE_ENV !== "production" || process.env.TRPC_UI === "true") {
  registerTrpcUiRoute(app, appRouter, port);
  log.info(`tRPC UI running at http://localhost:${port}/trpc-ui`);
}

app.listen(port, () => {
  log.info(`tRPC server running at http://localhost:${port}/api/trpc`);
});
