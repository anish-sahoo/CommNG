CREATE TYPE "public"."mentor_status_enum" AS ENUM('requested', 'approved', 'active');--> statement-breakpoint
CREATE TYPE "public"."permission_enum" AS ENUM('read', 'write', 'both');--> statement-breakpoint
CREATE TYPE "public"."role_namespace_enum" AS ENUM('global', 'channel', 'mentor', 'feature');--> statement-breakpoint
CREATE TABLE "channel_subscriptions" (
	"subscription_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "channel_subscriptions_subscription_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"channel_id" integer NOT NULL,
	"permission" "permission_enum" NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"channel_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "channels_channel_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "mentor_matching_requests" (
	"request_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mentor_matching_requests_request_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"request_preferences" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentors" (
	"mentor_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mentors_mentor_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"mentorship_preferences" text,
	"rank" text,
	"years_of_service" integer,
	"eligibility_data" jsonb,
	"status" "mentor_status_enum" DEFAULT 'requested' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorship_matches" (
	"match_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mentorship_matches_match_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"requestor_user_id" integer,
	"mentor_user_id" integer,
	"matched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"message_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "messages_message_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"channel_id" integer NOT NULL,
	"sender_id" integer,
	"message" text,
	"attachment_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"role_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "roles_role_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"namespace" "role_namespace_enum" NOT NULL,
	"subject_id" text,
	"action" text NOT NULL,
	"role_key" text NOT NULL,
	"channel_id" integer,
	"metadata" jsonb,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" integer,
	"metadata" jsonb,
	CONSTRAINT "pk_user_roles" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"phone_number" text,
	"clearance_level" text,
	"department" text,
	"branch" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channel_subscriptions" ADD CONSTRAINT "channel_subscriptions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_subscriptions" ADD CONSTRAINT "channel_subscriptions_channel_id_channels_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("channel_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_matching_requests" ADD CONSTRAINT "mentor_matching_requests_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_matches" ADD CONSTRAINT "mentorship_matches_requestor_user_id_users_user_id_fk" FOREIGN KEY ("requestor_user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_matches" ADD CONSTRAINT "mentorship_matches_mentor_user_id_users_user_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_channel_id_channels_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("channel_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_channel_id_channels_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("channel_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("role_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_channel_subscriptions_user_id" ON "channel_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ix_channel_subscriptions_channel_id" ON "channel_subscriptions" USING btree ("channel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_channels_name" ON "channels" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ix_mentor_matching_requests_user_id" ON "mentor_matching_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ix_mentors_user_id" ON "mentors" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_mentorship_matches_pair" ON "mentorship_matches" USING btree ("requestor_user_id","mentor_user_id");--> statement-breakpoint
CREATE INDEX "ix_mentorship_matches_requestor_user_id" ON "mentorship_matches" USING btree ("requestor_user_id");--> statement-breakpoint
CREATE INDEX "ix_mentorship_matches_mentor_user_id" ON "mentorship_matches" USING btree ("mentor_user_id");--> statement-breakpoint
CREATE INDEX "ix_messages_channel_id" ON "messages" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "ix_messages_sender_id" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_roles_role_key" ON "roles" USING btree ("role_key");--> statement-breakpoint
CREATE INDEX "ix_roles_namespace_subject" ON "roles" USING btree ("namespace","subject_id");--> statement-breakpoint
CREATE INDEX "ix_roles_channel_id" ON "roles" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "ix_user_roles_role_id" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "ix_user_roles_user_assigned_by" ON "user_roles" USING btree ("user_id","assigned_by");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_users_email" ON "users" USING btree ("email");