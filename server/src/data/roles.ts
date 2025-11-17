/**
 * RoleKey type system and builders.
 *
 * Each role key represents a permission for a specific resource, following the convention:
 *   - Namespaced roles with a subject:   `namespace:subject:action` (e.g., "channel:1:read")
 *   - Global/per-feature roles:          `namespace:action`         (e.g., "broadcast:create")
 *
 * Role key functions generate strongly typed string role keys. Types are exported for reference.
 */

import type { RoleNamespace } from "./db/schema.js";

/**
 * Role hierarchy configuration - the source of truth for action types and their privilege levels.
 * Each array is ordered from highest privilege to lowest.
 * Higher roles automatically grant all lower role permissions.
 *
 * This configuration is used for:
 * 1. Type-safe role builder functions
 * 2. Runtime permission hierarchy checks
 * 3. Ensuring consistency between role definitions and permission logic
 */
export const ROLE_HIERARCHIES = {
  // Channel permissions: admin can post and read, post can read
  channel: ["admin", "post", "read"],

  // Reporting permissions: Full hierarchy
  // admin > assign/delete/update/create > read
  reporting: ["admin", "assign", "delete", "update", "create", "read"],

  broadcast: ["create"],

  // Mentor namespace: No hierarchy yet
  mentor: [],

  // Global namespace has no hierarchy (admin is all-powerful via separate logic)
  global: ["admin"],
} as const satisfies Record<RoleNamespace, readonly string[]>;

// Extract action types from hierarchy for type safety
export type ChannelActions = (typeof ROLE_HIERARCHIES.channel)[number];
export type ReportingActions = (typeof ROLE_HIERARCHIES.reporting)[number];
export type BroadcastActions = (typeof ROLE_HIERARCHIES.broadcast)[number];

/**
 * Builds a role key for a channel-specific resource/action.
 *
 * @param action - The permission being requested.
 *   - "read": View channel content.
 *   - "post": Post messages/content in the channel.
 *   - "admin": Administer/manage channel (settings, members, etc).
 * @param id - The channel's unique numeric identifier.
 * @returns Role key string of shape `channel:<id>:<action>`, eg. "channel:42:post"
 */
export const channelRole = (action: ChannelActions, id: number) => {
  return `channel:${id}:${action}` as const;
};
/** A role key for actions scoped to a channel (e.g. "channel:13:admin") */
export type ChannelRoleKey = ReturnType<typeof channelRole>;

/**
 * Builds a role key for broadcast (mass communication) features.
 *
 * @param action - Only "create": Ability to initiate/broadcast a message blast.
 * @returns Role key string, e.g., "broadcast:create"
 */
export const broadcastRole = (action: BroadcastActions) => {
  return `broadcast:${action}` as const;
};
/** A role key for broadcast-related global permissions ("broadcast:create") */
type BroadcastRoleKey = ReturnType<typeof broadcastRole>;

/**
 * Builds a role key for reporting/analytics features.
 *
 * @param action
 *   - "read": Ability to access/view reports.
 *   - "create": Ability to generate new reports.
 *   - "update": Ability to modify reports.
 *   - "delete": Ability to delete reports.
 *   - "assign": Ability to assign reports to users.
 * @returns Role key string, e.g., "reporting:read"
 */
export const reportingRole = (action: ReportingActions) => {
  return `reporting:${action}` as const;
};
/** A role key for reporting-related permissions ("reporting:read", "reporting:create") */
type ReportingRoleKey = ReturnType<typeof reportingRole>;

/**
 * The global admin role key.
 * Grants superuser privileges application-wide.
 */
export const GLOBAL_ADMIN_KEY = `global:admin` as const;
/** The type for the global admin role key string */
type GlobalAdminKey = typeof GLOBAL_ADMIN_KEY;

/**
 * All allowable role key types in the application.
 * Used for type safety and permission checks.
 *
 * - ChannelRoleKey: channel-scoped actions (read/post/admin for a channel)
 * - BroadcastRoleKey: broadcast (mass messaging) actions
 * - ReportingRoleKey: reporting/analytics related actions
 * - GlobalAdminKey: superuser powers everywhere
 */
export type RoleKey =
  | ChannelRoleKey
  | BroadcastRoleKey
  | ReportingRoleKey
  | GlobalAdminKey;
