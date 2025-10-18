import { TRPCError } from "@trpc/server";
import { policyEngine } from "../service/policy-engine.js";
import { middleware } from "../trpc/trpc.js";

export const requirePermission = (permission: string) =>
  middleware(async ({ ctx, next }) => {
    if (permission.length === 0) {
      return next();
    }
    const userId = ctx?.user?.userId ?? ctx?.userId;
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No user in context",
      });
    }

    const allowed = (await policyEngine.validate(userId, permission)) ?? false;
    if (!allowed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient permission",
      });
    }
    return next();
  });
