"use client";

import type { AppRouter } from "@server/trpc/app_router";
import { createTRPCContext } from "@trpc/tanstack-react-query";

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

export type TRPCProcedures = ReturnType<typeof useTRPCClient>;

// Utility type to extract the return type of a tRPC procedure
// biome-ignore lint/suspicious/noExplicitAny: This is just a type helper, so it's ok
export type InferTRPCOutput<T> = T extends { query: (...args: any) => any }
  ? Awaited<ReturnType<T["query"]>>
  : never;
