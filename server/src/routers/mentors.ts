import { publicProcedure, router } from "../trpc/trpc.js";
import log from "../utils/logger.js";

export const mentorRouter = router({
  getMentors: publicProcedure.query(() => {
    log.info("getMentors");
    return ["Alice", "Bob"];
  }),
});
