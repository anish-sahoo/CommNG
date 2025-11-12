/**
 * RoleKey type system and builders.
 *
 * Each role key represents a permission for a specific resource, following the convention:
 *   - Namespaced roles with a subject:   `namespace:subject:action` (e.g., "channel:1:read")
 *   - Global/per-feature roles:          `namespace:action`         (e.g., "broadcast:create")
 *
 * Role key functions generate strongly typed string role keys. Types are exported for reference.
 */

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
export const channelRole = (action: "read" | "post" | "admin", id: number) => {
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
export const broadcastRole = (action: "create") => {
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
 * @returns Role key string, e.g., "reporting:read"
 */
export const reportingRole = (
  action: "read" | "create" | "update" | "delete" | "assign",
) => {
  return `reporting:${action}` as const;
};
/** A role key for reporting-related permissions ("reporting:read", "reporting:create") */
type ReportingRoleKey = ReturnType<typeof reportingRole>;

/**
 * The global admin role key.
 * Grants superuser privileges application-wide.
 */
export const GLOBAL_ADMIN_KEY = `global:admin`;
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
