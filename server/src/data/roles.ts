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
 * Zod schemas for validating role keys at runtime
 * All derived from the action enums above (single source of truth)
 */

/**
 * Validates a channel role key pattern: "channel:<number>:<action>"
 * Dynamically builds regex from channelActionsEnum
 */
const channelActionsPattern = channelActionsEnum.options.join("|");
export const channelRoleKeySchema = z
  .string()
  .regex(
    new RegExp(`^channel:\\d+:(${channelActionsPattern})$`),
    `Channel role must be in format 'channel:<id>:<action>' where action is ${channelActionsEnum.options.join(", ")}`,
  )
  .transform((val) => val as ChannelRoleKey);

/**
 * Validates a broadcast role key pattern: "broadcast:<action>"
 * Dynamically builds regex from broadcastActionsEnum
 */
const broadcastActionsPattern = broadcastActionsEnum.options.join("|");
export const broadcastRoleKeySchema = z
  .string()
  .regex(
    new RegExp(`^broadcast:(${broadcastActionsPattern})$`),
    `Broadcast role must be in format 'broadcast:<action>' where action is ${broadcastActionsEnum.options.join(", ")}`,
  )
  .transform((val) => val as BroadcastRoleKey);

/**
 * Validates a reporting role key pattern: "reporting:<action>"
 * Dynamically builds regex from reportingActionsEnum
 */
const reportingActionsPattern = reportingActionsEnum.options.join("|");
export const reportingRoleKeySchema = z
  .string()
  .regex(
    new RegExp(`^reporting:(${reportingActionsPattern})$`),
    `Reporting role must be in format 'reporting:<action>' where action is ${reportingActionsEnum.options.join(", ")}`,
  )
  .transform((val) => val as ReportingRoleKey);

/**
 * Validates the global admin role key: "global:admin"
 * Dynamically builds from globalActionsEnum
 */
const globalActionsPattern = globalActionsEnum.options.join("|");
export const globalAdminKeySchema = z
  .string()
  .regex(
    new RegExp(`^global:(${globalActionsPattern})$`),
    `Global role must be in format 'global:<action>' where action is ${globalActionsEnum.options.join(", ")}`,
  )
  .transform((val) => val as GlobalAdminKey);

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
