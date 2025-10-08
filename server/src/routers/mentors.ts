import { router, publicProcedure } from '../trpc/trpc.js';

export const mentorRouter = router({
  getMentors: publicProcedure.query(() => {
    return ['Alice', 'Bob'];
  }),
});
