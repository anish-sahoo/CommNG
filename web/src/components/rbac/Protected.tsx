"use client";

import type { RoleKey } from "@server/data/roles";
import type { ReactNode } from "react";
import { useHasAllRoles, useHasAnyRole, useHasRole } from "@/hooks/useHasRole";

type ProtectedProps = {
  children: ReactNode;
  fallback?: ReactNode;
} & (
  | { requiredRole: RoleKey; anyRole?: never; allRoles?: never }
  | { anyRole: RoleKey[]; requiredRole?: never; allRoles?: never }
  | { allRoles: RoleKey[]; requiredRole?: never; anyRole?: never }
);

/**
 * Protected component that conditionally renders children based on user roles
 *
 * @example
 * ```tsx
 * // Single role check
 * <Protected requiredRole="channel:1:post">
 *   <PostButton />
 * </Protected>
 *
 * // Check for any of multiple roles
 * <Protected anyRole={["reporting:read", "reporting:create"]}>
 *   <ReportsLink />
 * </Protected>
 *
 * // Check for all roles
 * <Protected allRoles={["channel:1:admin", "global:admin"]}>
 *   <AdminPanel />
 * </Protected>
 *
 * // With fallback content
 * <Protected requiredRole="channel:1:post" fallback={<AccessDenied />}>
 *   <PostButton />
 * </Protected>
 * ```
 */
export function Protected({ children, fallback, ...props }: ProtectedProps) {
  // Call hooks unconditionally to comply with Rules of Hooks
  // Pass empty arrays/dummy values when not needed
  const hasRequiredRole = useHasRole(props.requiredRole ?? ("" as RoleKey));
  const hasAnyRequiredRole = useHasAnyRole(props.anyRole ?? []);
  const hasAllRequiredRoles = useHasAllRoles(props.allRoles ?? []);

  let hasPermission = false;

  if (props.requiredRole) {
    hasPermission = hasRequiredRole;
  } else if (props.anyRole) {
    hasPermission = hasAnyRequiredRole;
  } else if (props.allRoles) {
    hasPermission = hasAllRequiredRoles;
  }

  if (!hasPermission) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
