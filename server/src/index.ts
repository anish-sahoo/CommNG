import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./trpc/app_router.js";
import log from "./utils/logger.js";

const server = createHTTPServer({
  router: appRouter,
});

const port = Number(process.env.PORT) || 3000;

// if (process.env.NODE_ENV !== "production" || process.env.TRPC_UI === 'true' ) {
//   const uiPort = port + 1;
//   createServer(async (req, res) => {
//     if (req.url !== "/trpc-ui") {
//       res.writeHead(404);
//       res.end("Not Found");
//       return;
//     }

//     try {
//       const { renderTrpcPanel } = await import("trpc-ui");

//       const html = renderTrpcPanel(appRouter, {
//         url: `http://localhost:${port}/trpc`,
//         meta: {
//           title: "My Backend Title",
//           description: "This is a description of my API.",
//         },
//       });

//       res.writeHead(200, { "Content-Type": "text/html" });
//       res.end(html);
//     } catch (err) {
//       res.writeHead(500, { "Content-Type": "text/plain" });
//       res.end("Failed to render tRPC UI");
//       console.error(err);
//     }
//   }).listen(uiPort, () => {
//     log.info(`tRPC UI available at http://localhost:${uiPort}/trpc-ui`);
//   });
// }

server.listen(port, () => {
  log.info(`tRPC server running at http://localhost:${port}`);
});
