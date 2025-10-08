import { commsRouter } from "../routers/comms.js";
import { mentorRouter } from "../routers/mentors.js";
import { reportsRouter } from "../routers/reports.js";
import { router } from "./trpc.js";

export const appRouter = router({
  comms: commsRouter,
  mentor: mentorRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
