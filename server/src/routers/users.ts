import { UserRepository } from "../data/repository/user-repo.js";
import { UserService } from "../service/user-service.js";
import { withErrorHandling } from "../trpc/error_handler.js";
import { procedure, protectedProcedure, router } from "../trpc/trpc.js";
import {
  checkEmailExistsInputSchema,
  createUserProfileInputSchema,
  getUserDataInputSchema,
  updateUserProfileInputSchema,
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

const createUserProfile = protectedProcedure
  .input(createUserProfileInputSchema)
  .meta({
    requiresAuth: true,
    description:
      "Create user profile data (name, phone, rank, department, branch, profile picture). Users can only create their own profile.",
  })
  .mutation(async ({ ctx, input }) => {
    return withErrorHandling("createUserProfile", async () => {
      const userId = ctx.auth.user.id;
      return await userService.createUserProfile(userId, input);
    });
  });

const updateUserProfile = protectedProcedure
  .input(updateUserProfileInputSchema)
  .meta({
    requiresAuth: true,
    description:
      "Update user profile data (name, phone, rank, department, branch, profile picture)",
  })
  .mutation(async ({ ctx, input }) => {
    return withErrorHandling("updateUserProfile", async () => {
      const userId = ctx.auth.user.id;
      return await userService.updateUserProfile(userId, input);
    });
  });

export const userRouter = router({
  getUserData,
  checkEmailExists,
  createUserProfile,
  updateUserProfile,
});
