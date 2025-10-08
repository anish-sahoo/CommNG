import { router } from './trpc.js';
import { commsRouter } from '../routers/comms.js';
import { mentorRouter } from '../routers/mentors.js';
import { reportsRouter } from '../routers/reports.js';

export const appRouter = router({
  comms: commsRouter,
  mentor: mentorRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
