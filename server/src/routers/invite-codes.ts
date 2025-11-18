import { AuthRepository } from "@/data/repository/auth-repo.js";
import { InviteCodeRepository } from "@/data/repository/invite-code-repo.js";
import { GLOBAL_CREATE_INVITE_KEY } from "@/data/roles.js";
import { InviteCodeService } from "@/service/invite-code-service.js";
import { withErrorHandling } from "@/trpc/error_handler.js";
import { procedure, roleProcedure, router } from "@/trpc/trpc.js";
import {
  createInviteCodeInputSchema,
  listInviteCodesInputSchema,
  revokeInviteCodeInputSchema,
  validateInviteCodeInputSchema,
} from "@/types/invite-code-types.js";

const inviteCodeService = new InviteCodeService(
  new InviteCodeRepository(),
  new AuthRepository(),
);

const inviteProcedure = roleProcedure([GLOBAL_CREATE_INVITE_KEY]);

/**
 * Create a new invite code (requires global:create-invite permission)
 */
const createInviteCode = inviteProcedure
  .input(createInviteCodeInputSchema)
  .meta({
    description:
      "Create a new invite code with specified role permissions. Requires global:create-invite permission.",
  })
  .mutation(async ({ ctx, input }) => {
    return withErrorHandling("createInviteCode", async () => {
      const adminUserId = ctx.auth.user.id;
      return await inviteCodeService.createInvite(
        adminUserId,
        input.roleKeys,
        input.expiresInHours,
      );
    });
  });

/**
 * Validate an invite code (public endpoint for sign-up flow)
 */
const validateInviteCode = procedure
  .input(validateInviteCodeInputSchema)
  .meta({
    description:
      "Validate an invite code and return its role assignments if valid. Public endpoint.",
  })
  .query(async ({ input }) => {
    return withErrorHandling("validateInviteCode", async () => {
      return await inviteCodeService.validateInviteCode(input.code);
    });
  });

/**
 * List all invite codes with optional filtering (requires global:create-invite permission)
 */
const listInviteCodes = inviteProcedure
  .input(listInviteCodesInputSchema)
  .meta({
    description:
      "List all invite codes with optional status filtering and pagination. Requires global:create-invite permission.",
  })
  .query(async ({ ctx, input }) => {
    return withErrorHandling("listInviteCodes", async () => {
      const adminUserId = ctx.auth.user.id;
      return await inviteCodeService.listInviteCodes(
        adminUserId,
        input.status,
        input.limit,
        input.offset,
      );
    });
  });

/**
 * Revoke an invite code (requires global:create-invite permission)
 */
const revokeInviteCode = inviteProcedure
  .input(revokeInviteCodeInputSchema)
  .meta({
    description:
      "Revoke an invite code, preventing its use. Requires global:create-invite permission.",
  })
  .mutation(async ({ ctx, input }) => {
    return withErrorHandling("revokeInviteCode", async () => {
      const adminUserId = ctx.auth.user.id;
      return await inviteCodeService.revokeInvite(adminUserId, input.codeId);
    });
  });

export const inviteCodeRouter = router({
  createInviteCode,
  validateInviteCode,
  listInviteCodes,
  revokeInviteCode,
});
