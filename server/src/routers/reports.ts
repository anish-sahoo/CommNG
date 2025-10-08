import { publicProcedure, router } from "../trpc/trpc.js";
import log from "../utils/logger.js";

export const reportsRouter = router({
  sendReport: publicProcedure.mutation(() => {
    log.info("sendReport");
    return { id: 1, content: "Monthly Report" };
  }),
});
