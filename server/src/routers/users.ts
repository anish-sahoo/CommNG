import { UserRepository } from "../data/repository/user-repo.js";
import { UserService } from "../service/user-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { protectedProcedure, router } from "../trpc/trpc.js";
import { getUserDataInputSchema } from "../types/user-types.js";

const userService = new UserService(new UserRepository());

const getUserData = protectedProcedure
  .input(getUserDataInputSchema)
  .meta({
    description: "Returns the public-facing data for a given user",
  })
  .query(({ input }) =>
    withErrorHandling("getUserData", () =>
      userService.getUserData(input.user_id),
    ),
  );

export const userRouter = router({
  getUserData,
});
