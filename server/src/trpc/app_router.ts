import { commsRouter } from "../routers/comms.js";
import { filesRouter } from "../routers/files.js";
import { mentorRouter } from "../routers/mentors.js";
import { reportsRouter } from "../routers/reports.js";
import { searchRouter } from "../routers/search.js";
import { userRouter } from "../routers/users.js";
import { router } from "./trpc.js";

export const appRouter = router({
  comms: commsRouter,
  mentor: mentorRouter,
  reports: reportsRouter,
  user: userRouter,
  files: filesRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
