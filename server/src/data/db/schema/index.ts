import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
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

// USERS
export const users = pgTable(
  "users",
  {
    userId: integer("user_id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    email: text("email").notNull(),
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

// ATTRIBUTES
export const attributes = pgTable("attributes", {
  attrId: integer("attr_id").primaryKey().generatedAlwaysAsIdentity(),
  attributeKey: text("attribute_key").notNull(),
  attributeValue: text("attribute_value").notNull(),
});

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

// USER <-> ATTRIBUTES
export const userAttributes = pgTable(
  "user_attributes",
  {
    userId: integer("user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    attrId: integer("attr_id")
      .references(() => attributes.attrId, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    // composite primary key
    sql`PRIMARY KEY (${table.userId.name}, ${table.attrId.name})`,
    index("ix_user_attributes_user_id").on(table.userId),
    index("ix_user_attributes_attr_id").on(table.attrId),
  ],
);

// CHANNEL <-> REQUIRED ATTRIBUTES
export const channelAttributes = pgTable(
  "channel_attributes",
  {
    channelId: integer("channel_id")
      .references(() => channels.channelId, { onDelete: "cascade" })
      .notNull(),
    attrId: integer("attr_id")
      .references(() => attributes.attrId, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    sql`PRIMARY KEY (${table.channelId.name}, ${table.attrId.name})`,
    index("ix_channel_attributes_channel_id").on(table.channelId),
    index("ix_channel_attributes_attr_id").on(table.attrId),
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
