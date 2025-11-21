"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

/**
 * Hook to fetch and cache the current user's roles (including implied permissions)
 * @returns Object containing roles array, loading state, and error
 */
export function useUserRoles() {
  const trpc = useTRPC();

  const { data: roles, ...rest } = useQuery(
    trpc.user.getUserRoles.queryOptions(undefined, {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: 2,
    }),
  );

  return {
    roles,
    ...rest,
  };
}
