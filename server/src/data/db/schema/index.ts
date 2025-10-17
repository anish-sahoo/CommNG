import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const permissionEnum = pgEnum("permission_enum", [
  "read",
  "write",
  "both",
]);

export const mentorStatusEnum = pgEnum("mentor_status_enum", [
  "requested",
  "approved",
  "active",
]);

export const roleNamespaceEnum = pgEnum("role_namespace_enum", [
  "global",
  "channel",
  "mentor",
  "feature",
]);

// USERS
export const users = pgTable(
  "users",
  {
    userId: integer("user_id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    phoneNumber: text("phone_number"),
    clearanceLevel: text("clearance_level"),
    department: text("department"),
    branch: text("branch"),
    createdAt: timestamp("created_at", { withTimezone: false })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("ux_users_email").on(table.email)],
);

// CHANNELS
export const channels = pgTable(
  "channels",
  {
    channelId: integer("channel_id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: false })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata"),
  },
  (table) => [uniqueIndex("ux_channels_name").on(table.name)],
);

/**
 * ROLES (shared role descriptors that can be attached to users)
 *
 * subjectId:
 * - Purpose: a free-text scope identifier that further scopes a role inside its namespace.
 * - Required: must be non-NULL for any namespace other than "global" (enforced by ck_roles_subject_presence).
 * - Format / conventions:
 *   - Use short, stable, kebab-case tokens (e.g. "reporting", "mentorship", "messages").
 *   - Do not embed numeric primary keys if a proper FK exists (e.g. channelId).
 *   - Avoid storing PII or transient values; prefer descriptive logical names.
 * - Examples:
 *   - namespace = "global"  -> subjectId = NULL
 *   - namespace = "feature" -> subjectId = "reporting"
 *   - namespace = "mentor"  -> subjectId = "mentorship" (shared mentorship subject)
 *   - namespace = "channel" -> subjectId = "messages" (channelId must also be set)
 *
 * Notes:
 * - Use subjectId to express the logical area the role controls; combine with namespace and action
 *   (and channelId when relevant) to form a stable roleKey.
 */
export const roles = pgTable(
  "roles",
  {
    roleId: integer("role_id").primaryKey().generatedAlwaysAsIdentity(),
    namespace: roleNamespaceEnum("namespace").notNull(),
    subjectId: text("subject_id"),
    action: text("action").notNull(),
    roleKey: text("role_key").notNull(),
    channelId: integer("channel_id").references(() => channels.channelId, {
      onDelete: "cascade",
    }),
    metadata: jsonb("metadata"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: false })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    sql`CONSTRAINT ck_roles_channel_namespace CHECK (${table.namespace.name} <> 'channel' OR ${table.channelId.name} IS NOT NULL)`,
    sql`CONSTRAINT ck_roles_subject_presence CHECK (${table.namespace.name} = 'global' OR ${table.subjectId.name} IS NOT NULL)`,
    sql`CONSTRAINT ck_roles_role_key CHECK (${table.roleKey.name} <> '')`,
    uniqueIndex("ux_roles_role_key").on(table.roleKey),
    index("ix_roles_namespace_subject").on(table.namespace, table.subjectId),
    index("ix_roles_channel_id").on(table.channelId),
  ],
);

// USER <-> ROLES (assign users to reusable roles)
export const userRoles = pgTable(
  "user_roles",
  {
    userId: integer("user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    roleId: integer("role_id")
      .references(() => roles.roleId, { onDelete: "cascade" })
      .notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: false })
      .defaultNow()
      .notNull(),
    assignedBy: integer("assigned_by").references(() => users.userId, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata"),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.roleId],
      name: "pk_user_roles",
    }),
    index("ix_user_roles_role_id").on(table.roleId),
    index("ix_user_roles_user_assigned_by").on(table.userId, table.assignedBy),
  ],
);

// SUBSCRIPTIONS
export const channelSubscriptions = pgTable(
  "channel_subscriptions",
  {
    subscriptionId: integer("subscription_id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    channelId: integer("channel_id")
      .references(() => channels.channelId, { onDelete: "cascade" })
      .notNull(),
    permission: permissionEnum("permission").notNull(),
    notificationsEnabled: boolean("notifications_enabled")
      .default(true)
      .notNull(),
  },
  (table) => [
    index("ix_channel_subscriptions_user_id").on(table.userId),
    index("ix_channel_subscriptions_channel_id").on(table.channelId),
  ],
);

// MESSAGES
export const messages = pgTable(
  "messages",
  {
    messageId: integer("message_id").primaryKey().generatedAlwaysAsIdentity(),
    channelId: integer("channel_id")
      .references(() => channels.channelId, { onDelete: "cascade" })
      .notNull(),
    senderId: integer("sender_id").references(() => users.userId, {
      onDelete: "set null",
    }),
    message: text("message"),
    attachmentUrl: text("attachment_url"),
    createdAt: timestamp("created_at", { withTimezone: false })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ix_messages_channel_id").on(table.channelId),
    index("ix_messages_sender_id").on(table.senderId),
  ],
);

// MENTORS
export const mentors = pgTable(
  "mentors",
  {
    mentorId: integer("mentor_id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    mentorshipPreferences: text("mentorship_preferences"),
    rank: text("rank"),
    yearsOfService: integer("years_of_service"),
    eligibilityData: jsonb("eligibility_data"),
    status: mentorStatusEnum("status").default("requested").notNull(),
  },
  (table) => [
    // CHECK (years_of_service IS NULL OR years_of_service >= 0)
    sql`CONSTRAINT ck_mentors_years_of_service CHECK (${table.yearsOfService.name} IS NULL OR ${table.yearsOfService.name} >= 0)`,
    index("ix_mentors_user_id").on(table.userId),
  ],
);

// MENTORSHIP REQUESTS
export const mentorMatchingRequests = pgTable(
  "mentor_matching_requests",
  {
    requestId: integer("request_id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    requestPreferences: text("request_preferences"),
    createdAt: timestamp("created_at", { withTimezone: false })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("ix_mentor_matching_requests_user_id").on(table.userId)],
);

// MENTORSHIP MATCHES
export const mentorshipMatches = pgTable(
  "mentorship_matches",
  {
    matchId: integer("match_id").primaryKey().generatedAlwaysAsIdentity(),
    requestorUserId: integer("requestor_user_id").references(
      () => users.userId,
    ),
    mentorUserId: integer("mentor_user_id").references(() => users.userId),
    matchedAt: timestamp("matched_at", { withTimezone: false })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("ux_mentorship_matches_pair").on(
      table.requestorUserId,
      table.mentorUserId,
    ),
    index("ix_mentorship_matches_requestor_user_id").on(table.requestorUserId),
    index("ix_mentorship_matches_mentor_user_id").on(table.mentorUserId),
  ],
);

// USER DEVICES: track devices for push notifications
export const userDevices = pgTable(
  "user_devices",
  {
    deviceId: integer("device_id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    deviceType: text("device_type").notNull(), // "ios", "android", "web"
    deviceToken: text("device_token").notNull(), // FCM/APNS token
    createdAt: timestamp("created_at", { withTimezone: false })
      .defaultNow()
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    index("ix_user_devices_user_id").on(table.userId),
    index("ix_user_devices_token").on(table.deviceToken),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserDevice = typeof userDevices.$inferSelect;
export type NewUserDevice = typeof userDevices.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

// const roleKeys = await db
//   .select({ roleKey: roles.roleKey })
//   .from(userRoles)
//   .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
//   .where(eq(userRoles.userId, userId));
// engine.hasAccess(roleKeys, `channel:${channelId}:read`);
