import type { RoleKey } from "@server/data/roles";
import { PERMISSION_GROUPS } from "../types";

/**
 * Get the user-friendly display name for a role key
 * @param roleKey - The role key to get the display name for
 * @returns The display name, or the role key itself if not found
 */
export function getDisplayName(roleKey: RoleKey): string {
  for (const group of PERMISSION_GROUPS) {
    const permission = group.permissions.find((p) => p.key === roleKey);
    if (permission) {
      return permission.label;
    }
  }
  return roleKey;
}

/**
 * Recursively find all permissions that are implied by (descendants of) a given role
 * @param roleKey - The parent role key
 * @returns Array of all descendant role keys
 */
export function getAllDescendants(roleKey: RoleKey): RoleKey[] {
  const descendants: RoleKey[] = [];

  for (const group of PERMISSION_GROUPS) {
    for (const permission of group.permissions) {
      if (permission.impliedBy === roleKey) {
        descendants.push(permission.key);
        // Recursively get descendants of this child
        descendants.push(...getAllDescendants(permission.key));
      }
    }
  }

  return descendants;
}

/**
 * Filter out redundant permissions that are implied by others
 * Returns only the minimal set of permissions needed
 * @param roles - Set of role keys to minimize
 * @returns Array of minimal role keys (no redundant implied permissions)
 */
export function getMinimalRoleSet(roles: Set<RoleKey>): RoleKey[] {
  const roleArray = Array.from(roles);
  const minimalRoles: RoleKey[] = [];

  // If global:admin is selected, that's all we need
  if (roles.has("global:admin")) {
    return ["global:admin"];
  }

  // For each role, check if it's implied by any other selected role
  for (const role of roleArray) {
    let isImplied = false;

    // Check if this role is implied by another selected role
    for (const group of PERMISSION_GROUPS) {
      for (const permission of group.permissions) {
        if (permission.key === role && permission.impliedBy) {
          // Check if the parent is selected
          if (roles.has(permission.impliedBy)) {
            isImplied = true;
            break;
          }
        }
      }
      if (isImplied) break;
    }

    // Only include if not implied by another role
    if (!isImplied) {
      minimalRoles.push(role);
    }
  }

  return minimalRoles;
}

/**
 * Expand a minimal set of role keys to include all implied permissions
 * @param roleKeys - Array of parent role keys
 * @returns Array of all role keys including implied descendants
 */
export function getExpandedRoleKeys(roleKeys: RoleKey[]): RoleKey[] {
  const expandedSet = new Set<RoleKey>();

  for (const role of roleKeys) {
    // Add the role itself
    expandedSet.add(role);

    // If it's global:admin, add all permissions
    if (role === "global:admin") {
      for (const group of PERMISSION_GROUPS) {
        for (const permission of group.permissions) {
          expandedSet.add(permission.key);
        }
      }
    } else {
      // Add all descendants
      const descendants = getAllDescendants(role);
      for (const descendant of descendants) {
        expandedSet.add(descendant);
      }
    }
  }

  return Array.from(expandedSet);
}

/**
 * Check if a role is implied by any other selected role
 * @param roleKey - The role to check
 * @param selectedRoles - Set of currently selected roles
 * @returns true if the role is implied by another selected role
 */
export function isRoleImplied(
  roleKey: RoleKey,
  selectedRoles: Set<RoleKey>,
): boolean {
  // Check for global:admin
  if (roleKey !== "global:admin" && selectedRoles.has("global:admin")) {
    return true;
  }

  // Check if this role is implied by any selected parent
  for (const group of PERMISSION_GROUPS) {
    for (const permission of group.permissions) {
      if (permission.key === roleKey && permission.impliedBy) {
        if (selectedRoles.has(permission.impliedBy)) {
          return true;
        }
      }
    }
  }

  return false;
}
