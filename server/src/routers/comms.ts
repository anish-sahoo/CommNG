import { router, publicProcedure } from '../trpc/trpc.js';

export const commsRouter = router({
  ping: publicProcedure.query(() => {
    return 'pong from comms';
  }),
});
