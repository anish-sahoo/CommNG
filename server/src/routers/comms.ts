import { procedure, router } from "../trpc/trpc.js";
import log from "../utils/logger.js";

const ping = procedure.query(() => {
  log.debug("ping");
  return "pong from comms";
});

export const commsRouter = router({
  ping,
});
