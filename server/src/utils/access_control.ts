import { TRPCError } from "@trpc/server";
import { policyEngine } from "../service/policy-engine.js";
import { middleware } from "../trpc/trpc.js";

export const requirePermission = (permission: string, error_message?: string) =>
  middleware(async ({ ctx, next }) => {
    if (permission.length === 0) {
      return next();
    }
    const userId = ctx?.auth?.user.id;
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const allowed = (await policyEngine.validate(userId, permission)) ?? false;
    if (!allowed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: error_message ?? "Insufficient permission",
      });
    }
    return next();
  });
