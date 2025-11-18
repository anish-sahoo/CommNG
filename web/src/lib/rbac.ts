import type { RoleKey } from "@server/data/roles";

/**
 * Check if a user has a specific role
 * @param userRoles Array of roles the user has
 * @param roleKey Role to check for
 * @returns true if user has the role
 */
export function hasRole(userRoles: RoleKey[], roleKey: RoleKey): boolean {
  return userRoles.includes(roleKey);
}

/**
 * Check if a user has any of the specified roles
 * @param userRoles Array of roles the user has
 * @param roleKeys Array of roles to check for
 * @returns true if user has at least one of the roles
 */
export function hasAnyRole(userRoles: RoleKey[], roleKeys: RoleKey[]): boolean {
  return roleKeys.some((role) => userRoles.includes(role));
}

/**
 * Check if a user has all of the specified roles
 * @param userRoles Array of roles the user has
 * @param roleKeys Array of roles to check for
 * @returns true if user has all of the roles
 */
export function hasAllRoles(
  userRoles: RoleKey[],
  roleKeys: RoleKey[],
): boolean {
  return roleKeys.every((role) => userRoles.includes(role));
}
