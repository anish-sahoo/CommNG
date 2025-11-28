import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { auth } from "../auth.js";
import { AuthRepository } from "../data/repository/auth-repo.js";
import type { RoleKey } from "../data/roles.js";
import { PolicyEngine } from "../service/policy-engine.js";

const authRepository = new AuthRepository();

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

  const roles = session
    ? await authRepository.getRolesForUser(session.user.id)
    : null;

  return { auth: session, roles };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Meta type for tRPC procedures
 */
type Meta = {
  description?: string;
};

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC
  .context<Context>()
  .meta<Meta>()
  .create({
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
  if (!opts.ctx.auth || !opts.ctx.roles) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ...opts,
    ctx: { auth: opts.ctx.auth, roles: opts.ctx.roles },
  });
});

/**
 * Creates a procedure that requires the user to have at least one of the specified roles.
 * Global admins automatically bypass all role checks.
 * @param requiredRoles Array of role keys that are allowed to access this procedure
 * @returns A tRPC procedure with role-based access control
 */
export function roleProcedure(requiredRoles: RoleKey[]) {
  return protectedProcedure.use(async (opts) => {
    const userRoles = opts.ctx.roles;

    // Check if user has ANY of the required roles
    const hasPermission = PolicyEngine.validateList(userRoles, requiredRoles);

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      });
    }

    return opts.next();
  });
}

/**
 * Validates that the user has at least one of the required roles.
 * Call this inside your mutation/query handler where types are properly inferred.
 * Global admins automatically bypass all role checks.
 * @param ctx The tRPC context (must have auth and roles)
 * @param requiredRoles Array of role keys - user must have at least one
 * @throws TRPCError with code UNAUTHORIZED if not authenticated
 * @throws TRPCError with code FORBIDDEN if user lacks required permissions
 * @example
 * .mutation(async ({ ctx, input }) => {
 *   ensureHasRole(ctx, [channelRole("post", input.channelId)]);
 *
 *   // ... rest of your implementation
 * })
 */
export function ensureHasRole(
  ctx: Context,
  requiredRoles: RoleKey[],
): asserts ctx is Context & {
  auth: NonNullable<Context["auth"]>;
  roles: NonNullable<Context["roles"]>;
} {
  if (!ctx.auth || !ctx.roles) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const roles = ctx.roles;

  // Check if user has any of the required roles
  const hasPermission = PolicyEngine.validateList(roles, requiredRoles);

  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Insufficient permissions",
    });
  }
}
