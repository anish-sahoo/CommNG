import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./trpc/app_router.js";

const server = createHTTPServer({
  router: appRouter,
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => {
  console.log(`tRPC server running at http://localhost:${port}`);
});
