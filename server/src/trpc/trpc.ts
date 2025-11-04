import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { auth } from "../auth.js";

export async function createContext(opts: CreateExpressContextOptions) {
  // Convert Express IncomingHttpHeaders to Web API Headers
  const headers = new Headers();
  for (const [key, value] of Object.entries(opts.req.headers)) {
    if (value) {
      const headerValue = Array.isArray(value) ? value[0] : value;
      if (headerValue) {
        headers.set(key, headerValue);
      }
    }
  }

  const session = await auth.api.getSession({
    headers,
  });

  return { auth: session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape }) {
    return {
      ...shape,
      data: { ...shape.data, stack: undefined },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const middleware = t.middleware;

export const procedure = t.procedure;
export const protectedProcedure = procedure.use(async (opts) => {
  if (!opts.ctx.auth) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({ ctx: { auth: opts.ctx.auth } });
});
