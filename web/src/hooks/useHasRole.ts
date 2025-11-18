"use client";

import type { RoleKey } from "@server/data/roles";
import { hasAllRoles, hasAnyRole, hasRole } from "@/lib/rbac";
import { useUserRoles } from "./useUserRoles";

/**
 * Hook to check if the current user has a specific role
 * @param roleKey Role to check for
 * @returns true if user has the role, false otherwise (also returns false while loading)
 */
export function useHasRole(roleKey: RoleKey): boolean {
  const { roles, isLoading } = useUserRoles();

  if (isLoading || !roles) {
    return false;
  }

  return hasRole(roles, roleKey);
}

/**
 * Hook to check if the current user has any of the specified roles
 * @param roleKeys Array of roles to check for
 * @returns true if user has at least one of the roles, false otherwise (also returns false while loading)
 */
export function useHasAnyRole(roleKeys: RoleKey[]): boolean {
  const { roles, isLoading } = useUserRoles();

  if (isLoading || !roles) {
    return false;
  }

  return hasAnyRole(roles, roleKeys);
}

/**
 * Hook to check if the current user has all of the specified roles
 * @param roleKeys Array of roles to check for
 * @returns true if user has all of the roles, false otherwise (also returns false while loading)
 */
export function useHasAllRoles(roleKeys: RoleKey[]): boolean {
  const { roles, isLoading } = useUserRoles();

  if (isLoading || !roles) {
    return false;
  }

  return hasAllRoles(roles, roleKeys);
}
