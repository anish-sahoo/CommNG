import { UserRepository } from "../data/repository/user-repo.js";
import { UserService } from "../service/user-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { procedure, protectedProcedure, router } from "../trpc/trpc.js";
import {
  checkEmailExistsInputSchema,
  getUserDataInputSchema,
} from "../types/user-types.js";

const userService = new UserService(new UserRepository());

const getUserData = protectedProcedure
  .input(getUserDataInputSchema)
  .meta({
    description: "Returns the public-facing data for a given user",
  })
  .query(async ({ input }) => {
    return withErrorHandling("getUserData", async () => {
      return await userService.getUserData(input.user_id);
    });
  });

const checkEmailExists = procedure
  .input(checkEmailExistsInputSchema)
  .meta({
    description: "Returns whether a user exists for the provided email",
  })
  .query(async ({ input }) => {
    return withErrorHandling("checkEmailExists", async () => {
      return await userService.doesUserExistByEmail(input.email);
    });
  });

export const userRouter = router({
  getUserData,
  checkEmailExists,
});
