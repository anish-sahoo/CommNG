import { TRPCError } from "@trpc/server";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../types/errors.js";
import log from "../utils/logger.js";

export function handleProcedureError(error: unknown, context: string): never {
  log.error(`${context}: ${error}`);

  if (error instanceof NotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof UnauthorizedError) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof ForbiddenError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof ValidationError || error instanceof BadRequestError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof ConflictError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `Failed to ${context}`,
    cause: error,
  });
}

export function withErrorHandling<T>(
  context: string,
  fn: () => Promise<T>,
): Promise<T> {
  return fn().catch((error) => handleProcedureError(error, context));
}
