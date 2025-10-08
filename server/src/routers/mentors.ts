import { publicProcedure, router } from "../trpc/trpc.js";

export const mentorRouter = router({
  getMentors: publicProcedure.query(() => {
    return ["Alice", "Bob"];
  }),
});
