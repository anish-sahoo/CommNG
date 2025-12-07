/**
 * RoleKey type system and builders.
 *
 * Each role key represents a permission for a specific resource, following the convention:
 *   - Namespaced roles with a subject:   `namespace:subject:action` (e.g., "channel:1:read")
 *   - Global/per-feature roles:          `namespace:action`         (e.g., "broadcast:create")
 *
 * Role key functions generate strongly typed string role keys. Types are exported for reference.
 */

import { z } from "zod";
import type { RoleNamespace } from "../data/db/schema.js";

/**
 * SINGLE SOURCE OF TRUTH: Zod schemas define all valid actions
 * Everything else derives from these schemas
 */

// Define valid actions as Zod enums (ordered from highest to lowest privilege)
const channelActionsEnum = z.enum(["admin", "post", "read"]);
const reportingActionsEnum = z.enum([
  "admin",
  "assign",
  "delete",
  "update",
  "create",
  "read",
]);
const broadcastActionsEnum = z.enum(["create"]);
const globalActionsEnum = z.enum(["admin", "create-invite"]);

export type ChannelActions = z.infer<typeof channelActionsEnum>;
export type ReportingActions = z.infer<typeof reportingActionsEnum>;
export type BroadcastActions = z.infer<typeof broadcastActionsEnum>;
export type GlobalActions = z.infer<typeof globalActionsEnum>;

/**
 * Role hierarchy configuration derived from Zod schemas.
 * Each array is ordered from highest privilege to lowest.
 * Higher roles automatically grant all lower role permissions.
 *
 * This configuration is used for runtime permission hierarchy checks.
 */
export const ROLE_HIERARCHIES = {
  // Channel permissions: admin can post and read, post can read
  channel: channelActionsEnum.options,

  // Reporting permissions: Full hierarchy
  // admin > assign/delete/update/create > read
  reporting: reportingActionsEnum.options,

  broadcast: broadcastActionsEnum.options,

  // Mentor namespace: No hierarchy yet
  mentor: [],

  // Global permissions: admin > create-invite
  global: globalActionsEnum.options,
} as const satisfies Record<RoleNamespace, readonly string[]>;

const reportingRoleKeySchema = z.templateLiteral([
  z.literal("reporting:"),
  reportingActionsEnum,
]);
const channelRoleKeySchema = z.templateLiteral([
  z.literal("channel:"),
  z.number(),
  z.literal(":"),
  channelActionsEnum,
]);
const broadcastRoleKeySchema = z.templateLiteral([
  z.literal("broadcast:"),
  broadcastActionsEnum,
]);
const globalAdminKeySchema = z.templateLiteral([
  z.literal("global:"),
  globalActionsEnum,
]);

type ReportingRoleKey = z.infer<typeof reportingRoleKeySchema>;
type ChannelRoleKey = z.infer<typeof channelRoleKeySchema>;
type BroadcastRoleKey = z.infer<typeof broadcastRoleKeySchema>;

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
export const channelRole = (
  action: ChannelActions,
  id: number,
): ChannelRoleKey => {
  return `channel:${id}:${action}` as const;
};

/**
 * Builds a role key for broadcast (mass communication) features.
 *
 * @param action - Only "create": Ability to initiate/broadcast a message blast.
 * @returns Role key string, e.g., "broadcast:create"
 */
export const broadcastRole = (action: BroadcastActions): BroadcastRoleKey => {
  return `broadcast:${action}` as const;
};

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
export const reportingRole = (action: ReportingActions): ReportingRoleKey => {
  return `reporting:${action}` as const;
};

/**
 * The global admin role key.
 * Grants superuser privileges application-wide.
 */
export const GLOBAL_ADMIN_KEY = `global:admin` as const;
/** The type for the global admin role key string */
type GlobalAdminKey = typeof GLOBAL_ADMIN_KEY;

/**
 * The global create-invite role key.
 * Grants permission to create and manage invite codes.
 */
export const GLOBAL_CREATE_INVITE_KEY = `global:create-invite` as const;
/** The type for the global create-invite role key string */
type GlobalCreateInviteKey = typeof GLOBAL_CREATE_INVITE_KEY;

/**
 * All allowable role key types in the application.
 * Used for type safety and permission checks.
 *
 * - ChannelRoleKey: channel-scoped actions (read/post/admin for a channel)
 * - BroadcastRoleKey: broadcast (mass messaging) actions
 * - ReportingRoleKey: reporting/analytics related actions
 * - GlobalAdminKey: superuser powers everywhere
 * - GlobalCreateInviteKey: permission to create and manage invite codes
 */
export type RoleKey =
  | ChannelRoleKey
  | BroadcastRoleKey
  | ReportingRoleKey
  | GlobalAdminKey
  | GlobalCreateInviteKey;

/**
 * Master role key schema that validates any valid role key
 */
export const roleKeySchema = z.union([
  channelRoleKeySchema,
  broadcastRoleKeySchema,
  reportingRoleKeySchema,
  globalAdminKeySchema,
]);

/**
 * Schema for an array of role keys
 */
export const roleKeysArraySchema = z
  .array(roleKeySchema)
  .min(1, "At least one role must be provided");
