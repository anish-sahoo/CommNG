import { publicProcedure, router } from "../trpc/trpc.js";
import log from "../utils/logger.js";

export const commsRouter = router({
  ping: publicProcedure.query(() => {
    log.info("ping");
    return "pong from comms";
  }),
});
