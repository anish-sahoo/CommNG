import { router, publicProcedure } from '../trpc/trpc.js';

export const reportsRouter = router({
  sendReport: publicProcedure.mutation(() => {
    return { id: 1, content: 'Monthly Report' };
  }),
});
