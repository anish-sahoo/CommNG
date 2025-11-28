import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { RoleKey } from "../../data/roles.js";

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

export const menteeStatusEnum = pgEnum("mentee_status_enum", [
  "active",
  "inactive",
  "matched",
]);

export const matchStatusEnum = pgEnum("match_status_enum", [
  "pending", // Mentee requested, waiting for mentor acceptance
  "accepted", // Mentor accepted the request
  "declined", // Mentor declined the request
]);

export const messageBlastStatusEnum = pgEnum("message_blast_status_enum", [
  "draft",
  "sent",
  "failed",
]);

export const roleNamespaceEnum = pgEnum("role_namespace_enum", [
  "global",
  "channel",
  "mentor",
  "broadcast",
  "reporting",
]);

export const visibilityEnum = pgEnum("visibility_enum", ["private", "public"]);

export type RoleNamespace = (typeof roleNamespaceEnum.enumValues)[number];

export const channelPostPermissionEnum = pgEnum(
  "channel_post_permission_enum",
  ["admin", "everyone", "custom"],
);

// Mentorship application enums
export const positionTypeEnum = pgEnum("position_type_enum", [
  "active",
  "guard",
  "reserve",
]);

export const serviceTypeEnum = pgEnum("service_type_enum", [
  "enlisted",
  "officer",
]);

export const meetingFormatEnum = pgEnum("meeting_format_enum", [
  "in-person",
  "virtual",
  "hybrid",
  "no-preference",
]);

export const careerStageEnum = pgEnum("career_stage_enum", [
  "new-soldiers",
  "junior-ncos",
  "senior-ncos",
  "junior-officers",
  "senior-officers",
  "transitioning",
  "no-preference",
]);

// pgvector support - custom type for vector columns
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(512)"; // Amazon Titan v2 embeddings are 512 dimensions
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

export const users = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    phoneNumber: text("phone_number"),
    image: uuid("image").references(() => files.fileId, {
      onDelete: "set null",
    }),
    rank: text("rank"),
    department: text("department"),
    branch: text("branch"),
    positionType: positionTypeEnum("position_type"),
    serviceType: serviceTypeEnum("service_type"),
    detailedPosition: text("detailed_position"),
    detailedRank: text("detailed_rank"),
    location: text("location"),
    about: text("about"),
    interests: jsonb("interests"),

    signalVisibility: visibilityEnum("signal_visibility")
      .notNull()
      .default("private"),
    emailVisibility: visibilityEnum("email_visibility")
      .notNull()
      .default("private"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("ux_users_email").on(table.email)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// CHANNELS
export const channels = pgTable(
  "channels",
  {
    channelId: integer("channel_id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata"),
    postPermissionLevel: channelPostPermissionEnum("post_permission_level")
      .notNull()
      .default("admin"),
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
    roleKey: text("role_key").notNull().$type<RoleKey>(),
    channelId: integer("channel_id").references(() => channels.channelId, {
      onDelete: "cascade",
    }),
    metadata: jsonb("metadata"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
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

export const files = pgTable("files", {
  fileId: uuid("file_id").primaryKey().defaultRandom(),
  fileName: text("file_name").notNull(),
  location: text("location").notNull(),
  metadata: jsonb("metadata"),
});

// USER <-> ROLES (assign users to reusable roles)
export const userRoles = pgTable(
  "user_roles",
  {
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    roleId: integer("role_id")
      .references(() => roles.roleId, { onDelete: "cascade" })
      .notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    assignedBy: text("assigned_by").references(() => users.id, {
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

// CHANNEL SUBSCRIPTIONS - for notification preferences only
// Access control is handled via the roles system
export const channelSubscriptions = pgTable(
  "channel_subscriptions",
  {
    subscriptionId: integer("subscription_id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    channelId: integer("channel_id")
      .references(() => channels.channelId, { onDelete: "cascade" })
      .notNull(),
    notificationsEnabled: boolean("notifications_enabled")
      .default(true)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("ux_channel_subscriptions_user_channel").on(
      table.userId,
      table.channelId,
    ),
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
    senderId: text("sender_id").references(() => users.id, {
      onDelete: "set null",
    }),
    message: text("message"),
    attachmentUrl: text("attachment_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ix_messages_channel_id").on(table.channelId),
    index("ix_messages_sender_id").on(table.senderId),
  ],
);

export const messageAttachments = pgTable(
  "message_attachments",
  {
    attachmentId: integer("attachment_id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    messageId: integer("message_id")
      .references(() => messages.messageId, { onDelete: "cascade" })
      .notNull(),
    fileId: uuid("file_id")
      .references(() => files.fileId, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ix_message_attachments_message_id").on(table.messageId),
    index("ix_message_attachments_file_id").on(table.fileId),
    uniqueIndex("ux_message_attachments_message_file").on(
      table.messageId,
      table.fileId,
    ),
  ],
);

export const messageReactions = pgTable(
  "message_reactions",
  {
    reactionId: integer("reaction_id").primaryKey().generatedAlwaysAsIdentity(),
    messageId: integer("message_id")
      .references(() => messages.messageId, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("ux_message_reactions_user").on(
      table.messageId,
      table.userId,
      table.emoji,
    ),
    index("ix_message_reactions_message_id").on(table.messageId),
    index("ix_message_reactions_user_id").on(table.userId),
  ],
);

export type MessageReaction = typeof messageReactions.$inferSelect;
export type NewMessageReaction = typeof messageReactions.$inferInsert;

// MENTORS
export const mentors = pgTable(
  "mentors",
  {
    mentorId: integer("mentor_id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    mentorshipPreferences: text("mentorship_preferences"),
    yearsOfService: integer("years_of_service"),
    eligibilityData: jsonb("eligibility_data").$type<
      Record<string, unknown> | null | undefined
    >(),
    status: mentorStatusEnum("status").default("requested").notNull(),
    // New application fields
    resumeFileId: uuid("resume_file_id").references(() => files.fileId, {
      onDelete: "set null",
    }),
    strengths: jsonb("strengths").$type<string[]>().default([]), // Up to 5 strengths
    personalInterests: text("personal_interests"),
    whyInterestedResponses: jsonb("why_interested_responses").$type<string[]>(), // Ordered responses
    careerAdvice: text("career_advice"), // Text response to advice question
    preferredMenteeCareerStages: jsonb("preferred_mentee_career_stages").$type<
      string[]
    >(), // Array of career stage enum values
    preferredMeetingFormat: meetingFormatEnum("preferred_meeting_format"),
    hoursPerMonthCommitment: integer("hours_per_month_commitment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // CHECK (years_of_service IS NULL OR years_of_service >= 0)
    sql`CONSTRAINT ck_mentors_years_of_service CHECK (${table.yearsOfService.name} IS NULL OR ${table.yearsOfService.name} >= 0)`,
    sql`CONSTRAINT ck_mentors_hours_per_month CHECK (${table.hoursPerMonthCommitment.name} IS NULL OR ${table.hoursPerMonthCommitment.name} > 0)`,
    sql`CONSTRAINT ck_mentors_strengths_limit CHECK (jsonb_array_length(COALESCE(${table.strengths.name}, '[]'::jsonb)) <= 5)`,
    index("ix_mentors_user_id").on(table.userId),
    index("ix_mentors_status").on(table.status),
    index("ix_mentors_resume_file_id").on(table.resumeFileId),
  ],
);

// MENTORSHIP REQUESTS
export const mentorMatchingRequests = pgTable(
  "mentor_matching_requests",
  {
    requestId: integer("request_id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    requestPreferences: text("request_preferences"),
    createdAt: timestamp("created_at", { withTimezone: true })
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
    requestorUserId: text("requestor_user_id").references(() => users.id),
    mentorUserId: text("mentor_user_id").references(() => users.id),
    status: matchStatusEnum("status").default("pending").notNull(),
    matchedAt: timestamp("matched_at", { withTimezone: true })
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
    index("ix_mentorship_matches_status").on(table.status),
  ],
);

// Push subscriptions table — structured storage for web-push subscriptions.
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    subscriptionId: integer("subscription_id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    keys: jsonb("keys"),
    topics: jsonb("topics"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    uniqueIndex("ux_push_subscriptions_endpoint").on(table.endpoint),
    index("ix_push_subscriptions_user_id").on(table.userId),
  ],
);

// MENTEES: track mentees seeking mentorship
export const mentees = pgTable(
  "mentees",
  {
    menteeId: integer("mentee_id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    learningGoals: text("learning_goals"),
    experienceLevel: text("experience_level"),
    preferredMentorType: text("preferred_mentor_type"),
    status: menteeStatusEnum("status").default("active").notNull(),
    // New application fields
    resumeFileId: uuid("resume_file_id").references(() => files.fileId, {
      onDelete: "set null",
    }),
    personalInterests: text("personal_interests"),
    roleModelInspiration: text("role_model_inspiration"), // Text response
    hopeToGainResponses: jsonb("hope_to_gain_responses").$type<string[]>(), // Ordered responses
    mentorQualities: jsonb("mentor_qualities").$type<string[]>(), // What qualities look for
    preferredMeetingFormat: meetingFormatEnum("preferred_meeting_format"),
    hoursPerMonthCommitment: integer("hours_per_month_commitment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    sql`CONSTRAINT ck_mentees_hours_per_month CHECK (${table.hoursPerMonthCommitment.name} IS NULL OR ${table.hoursPerMonthCommitment.name} > 0)`,
    index("ix_mentees_user_id").on(table.userId),
    index("ix_mentees_status").on(table.status),
    index("ix_mentees_resume_file_id").on(table.resumeFileId),
  ],
);

// MESSAGE BLASTS: track broadcast messages
export const messageBlasts = pgTable(
  "message_blasts",
  {
    blastId: integer("blast_id").primaryKey().generatedAlwaysAsIdentity(),
    senderId: text("sender_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    targetAudience: jsonb("target_audience"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true })
      .notNull()
      .default(sql`NOW() + INTERVAL '24 hours'`),
    status: messageBlastStatusEnum("status").default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ix_message_blasts_sender_id").on(table.senderId),
    index("ix_message_blasts_status").on(table.status),
    index("ix_message_blasts_valid_until").on(table.validUntil),
  ],
);

// Reports
export const reportStatusEnum = pgEnum("report_status_enum", [
  "Pending",
  "Assigned",
  "Resolved",
]);

export const reportCategoryEnum = pgEnum("report_category_enum", [
  "Communication",
  "Mentorship",
  "Training",
  "Resources",
]);
export type ReportCategory = (typeof reportCategoryEnum.enumValues)[number];

export const reports = pgTable("reports", {
  reportId: uuid("report_id").primaryKey().defaultRandom(),
  category: reportCategoryEnum("category"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: reportStatusEnum("status").notNull().default("Pending"),
  submittedBy: text("submitted_by")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  assignedTo: text("assigned_to").references(() => users.id, {
    onDelete: "set null",
  }),
  assignedBy: text("assigned_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  resolvedAt: timestamp("resolved", { withTimezone: true }),
});

export const reportAttachments = pgTable(
  "report_attachments",
  {
    attachmentId: integer("attachment_id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    reportId: uuid("report_id")
      .references(() => reports.reportId, { onDelete: "cascade" })
      .notNull(),
    fileId: uuid("file_id")
      .references(() => files.fileId, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("ux_report_attachments_report_file").on(
      table.reportId,
      table.fileId,
    ),
    index("ix_report_attachments_report_id").on(table.reportId),
  ],
);

// MENTORSHIP EMBEDDINGS - store vector embeddings for semantic search
export const mentorshipEmbeddings = pgTable(
  "mentorship_embeddings",
  {
    embeddingId: integer("embedding_id")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    userType: text("user_type").notNull(), // "mentor" or "mentee"
    // Store embeddings for different text fields
    whyInterestedEmbedding: vector("why_interested_embedding"), // For mentors
    hopeToGainEmbedding: vector("hope_to_gain_embedding"), // For mentees
    // Combined embedding for overall profile matching
    profileEmbedding: vector("profile_embedding"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("ux_mentorship_embeddings_user_type").on(
      table.userId,
      table.userType,
    ),
    index("ix_mentorship_embeddings_user_id").on(table.userId),
    index("ix_mentorship_embeddings_user_type").on(table.userType),
    sql`CREATE INDEX IF NOT EXISTS ix_mentorship_embeddings_profile_embedding ON mentorship_embeddings USING ivfflat (profile_embedding vector_cosine_ops) WITH (lists = 100)`,
  ],
);

// INVITE CODES - for managing user invitations with role assignments
export const inviteCodes = pgTable(
  "invite_codes",
  {
    codeId: integer("code_id").primaryKey().generatedAlwaysAsIdentity(),
    code: text("code").notNull(),
    roleKeys: jsonb("role_keys").$type<RoleKey[]>().notNull(),
    createdBy: text("created_by")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedBy: text("used_by").references(() => users.id, {
      onDelete: "set null",
    }),
    usedAt: timestamp("used_at", { withTimezone: true }),
    revokedBy: text("revoked_by").references(() => users.id, {
      onDelete: "set null",
    }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("ux_invite_codes_code").on(table.code),
    index("ix_invite_codes_created_by").on(table.createdBy),
    index("ix_invite_codes_used_by").on(table.usedBy),
    index("ix_invite_codes_expires_at").on(table.expiresAt),
  ],
);

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type Mentee = typeof mentees.$inferSelect;
export type NewMentee = typeof mentees.$inferInsert;
export type MessageBlast = typeof messageBlasts.$inferSelect;
export type NewMessageBlast = typeof messageBlasts.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type ReportAttachment = typeof reportAttachments.$inferSelect;
export type NewReportAttachment = typeof reportAttachments.$inferInsert;
export type InviteCode = typeof inviteCodes.$inferSelect;
export type NewInviteCode = typeof inviteCodes.$inferInsert;
export type MentorshipEmbedding = typeof mentorshipEmbeddings.$inferSelect;
export type NewMentorshipEmbedding = typeof mentorshipEmbeddings.$inferInsert;
