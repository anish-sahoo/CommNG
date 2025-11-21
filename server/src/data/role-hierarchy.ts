import type { RoleNamespace } from "@/data/db/schema.js";
import type { RoleKey } from "@/data/roles.js";
import { ROLE_HIERARCHIES } from "@/data/roles.js";
import log from "@/utils/logger.js";

/**
 * Role Hierarchy System
 *
 * This module implements runtime permission hierarchy checks.
 * Higher-level roles automatically grant all permissions of lower-level roles.
 *
 * Example: If a user has `channel:1:admin`, they automatically get:
 *   - channel:1:admin (explicit)
 *   - channel:1:post (implied)
 *   - channel:1:read (implied)
 *
 * To extend for new namespaces:
 * 1. Add a new entry to ROLE_HIERARCHIES in roles.ts
 * 2. Define the action hierarchy from highest to lowest privilege
 * 3. Update the role builder function to use the new action types
 * 4. The system will automatically handle implied permissions
 *
 * Note: ROLE_HIERARCHIES in roles.ts is the source of truth for both
 * type safety and runtime behavior.
 */

// Re-export for convenience
export { ROLE_HIERARCHIES } from "./roles.js";

/**
 * Parses a role key into its components
 * @param roleKey Role key string (e.g., "channel:1:read", "reporting:create")
 * @returns Object with namespace, subject (if present), and action
 */
function parseRoleKey(roleKey: RoleKey): {
  namespace: RoleNamespace;
  subject: string | null;
  action: string;
} {
  const parts = roleKey.split(":");

  if (parts.length === 2 && parts[0] && parts[1]) {
    // Format: namespace:action (e.g., "reporting:create", "global:admin")
    return {
      namespace: parts[0] as RoleNamespace,
      subject: null,
      action: parts[1],
    };
  } else if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    // Format: namespace:subject:action (e.g., "channel:1:read")
    return {
      namespace: parts[0] as RoleNamespace,
      subject: parts[1],
      action: parts[2],
    };
  }

  log.error({ roleKey }, "Malformed role key in parseRoleKey");
  throw new Error(`Malformed role key: '${roleKey}'`);
}

/**
 * Builds a role key from components
 * @param namespace The namespace (e.g., "channel", "reporting")
 * @param subject The subject/resource ID (e.g., "1" for channel 1), or null
 * @param action The action (e.g., "read", "post", "admin")
 * @returns Role key string
 */
function buildRoleKey(
  namespace: RoleNamespace,
  subject: string | null,
  action: string,
) {
  if (subject === null) {
    return `${namespace}:${action}` as RoleKey;
  }
  return `${namespace}:${subject}:${action}` as RoleKey;
}

/**
 * Gets the position of an action in its namespace hierarchy.
 * Lower numbers = higher privilege.
 * @param namespace The namespace (e.g., "channel")
 * @param action The action (e.g., "admin", "post", "read")
 * @returns Position in hierarchy, or -1 if not found
 */
function getActionRank(
  namespace: RoleNamespace,
  action: string,
): number | null {
  const hierarchy = ROLE_HIERARCHIES[namespace];
  if (!hierarchy) {
    return null;
  }
  // Cast action to string since hierarchy is readonly array
  const idx = (hierarchy as readonly string[]).indexOf(action);
  if (idx === -1) {
    return null;
  }
  return idx;
}

/**
 * Determines if roleA implies (grants permission for) roleB.
 * Returns true if:
 * - They are the same role, OR
 * - They are in the same namespace+subject, and roleA has higher/equal privilege
 *
 * @param roleA The role to check (what the user has)
 * @param roleB The role being requested (what permission is needed)
 * @returns true if roleA grants roleB permission
 */
export function roleImplies(roleA: RoleKey, roleB: RoleKey): boolean {
  // Exact match always implies
  if (roleA === roleB) {
    return true;
  }

  const parsedA = parseRoleKey(roleA);
  const parsedB = parseRoleKey(roleB);

  // Must be same namespace
  if (parsedA.namespace !== parsedB.namespace) {
    return false;
  }

  // Must be same subject (or both null)
  if (parsedA.subject !== parsedB.subject) {
    return false;
  }

  // Check if namespace has a defined hierarchy
  const hierarchyKey = parsedA.namespace as keyof typeof ROLE_HIERARCHIES;
  const hierarchy = ROLE_HIERARCHIES[hierarchyKey];
  if (!hierarchy) {
    // No hierarchy defined = only exact matches count (already checked above)
    return false;
  }

  // Get ranks (lower number = higher privilege)
  const rankA = getActionRank(parsedA.namespace, parsedA.action);
  const rankB = getActionRank(parsedB.namespace, parsedB.action);

  // If either action is not in the hierarchy, no implication
  if (rankA === null || rankB === null) {
    return false;
  }

  // roleA implies roleB if roleA has equal or higher privilege (lower rank)
  return rankA <= rankB;
}

/**
 * Gets all roles implied by a given role.
 * Includes the role itself plus all lower-privilege roles in the same namespace+subject.
 *
 * @param roleKey The role to expand
 * @returns Array of all implied role keys (including the original)
 *
 * @example
 * getImpliedRoles("channel:1:admin")
 * // Returns: ["channel:1:admin", "channel:1:post", "channel:1:read"]
 *
 * @example
 * getImpliedRoles("channel:1:read")
 * // Returns: ["channel:1:read"]
 *
 * @example
 * getImpliedRoles("reporting:create")
 * // Returns: ["reporting:create", "reporting:read"]
 */
export function getImpliedRoles(roleKey: RoleKey): RoleKey[] {
  const parsed = parseRoleKey(roleKey);
  const hierarchy = ROLE_HIERARCHIES[parsed.namespace];

  // If no hierarchy exists, only the exact role is implied
  if (!hierarchy) {
    return [roleKey];
  }

  const currentRank = getActionRank(parsed.namespace, parsed.action);

  // If action not in hierarchy, only the exact role is implied
  if (currentRank === null) {
    return [roleKey];
  }

  // Get all actions from current rank to end (lower privilege)
  const impliedActions = hierarchy.slice(currentRank);

  // Build role keys for all implied actions
  return impliedActions.map((action) =>
    buildRoleKey(parsed.namespace, parsed.subject, action),
  );
}

/**
 * Checks if a user's role set grants permission for a required role.
 * Accounts for role hierarchy.
 *
 * @param userRoles Set of roles the user has
 * @param requiredRole The role/permission being checked
 * @returns true if user has the required role (directly or via hierarchy)
 */
export function hasPermission(
  userRoles: Set<RoleKey>,
  requiredRole: RoleKey,
): boolean {
  // Check each user role to see if it implies the required role
  for (const userRole of userRoles) {
    if (roleImplies(userRole, requiredRole)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a user's role set grants permission for ANY of the required roles.
 * Accounts for role hierarchy.
 *
 * @param userRoles Set of roles the user has
 * @param requiredRoles Array of acceptable roles (user needs at least one)
 * @returns true if user has any of the required roles (directly or via hierarchy)
 */
export function hasAnyPermission(
  userRoles: Set<RoleKey>,
  requiredRoles: RoleKey[],
): boolean {
  for (const requiredRole of requiredRoles) {
    if (hasPermission(userRoles, requiredRole)) {
      return true;
    }
  }
  return false;
}
