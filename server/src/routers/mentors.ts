import { procedure, router } from "../trpc/trpc.js";
import log from "../utils/logger.js";

const getMentors = procedure.query(() => {
  log.debug("getMentors");
  return ["Alice", "Bob"];
});

export const mentorRouter = router({
  getMentors,
});
