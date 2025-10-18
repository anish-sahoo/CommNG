import { initTRPC } from "@trpc/server";
import type { UserSchema } from "../types/user-types.js";

export interface Context {
  user?: UserSchema;
  userId?: number | null;
}

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const procedure = t.procedure;
export const middleware = t.middleware;
