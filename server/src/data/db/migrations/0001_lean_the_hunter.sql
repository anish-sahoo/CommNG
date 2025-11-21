CREATE TYPE "public"."career_stage_enum" AS ENUM('new-soldiers', 'junior-ncos', 'senior-ncos', 'junior-officers', 'senior-officers', 'transitioning', 'no-preference');--> statement-breakpoint
CREATE TYPE "public"."meeting_format_enum" AS ENUM('in-person', 'virtual', 'hybrid', 'no-preference');--> statement-breakpoint
CREATE TYPE "public"."position_type_enum" AS ENUM('active', 'guard', 'reserve');--> statement-breakpoint
CREATE TYPE "public"."report_category_enum" AS ENUM('Communication', 'Mentorship', 'Training', 'Resources');--> statement-breakpoint
CREATE TYPE "public"."service_type_enum" AS ENUM('enlisted', 'officer');--> statement-breakpoint
CREATE TABLE "invite_codes" (
	"code_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invite_codes_code_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" text NOT NULL,
	"role_keys" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_by" text,
	"used_at" timestamp,
	"revoked_by" text,
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mentorship_embeddings" (
	"embedding_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mentorship_embeddings_embedding_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"user_type" text NOT NULL,
	"why_interested_embedding" vector(1536),
	"hope_to_gain_embedding" vector(1536),
	"profile_embedding" vector(1536),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_attachments" (
	"attachment_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "message_attachments_attachment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"message_id" integer NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"subscription_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "push_subscriptions_subscription_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"keys" jsonb,
	"topics" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_attachments" (
	"attachment_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "report_attachments_attachment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"report_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_devices" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_devices" CASCADE;--> statement-breakpoint
ALTER TABLE "message_blasts" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "message_blasts" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
DROP TYPE "public"."message_blast_status_enum";--> statement-breakpoint
CREATE TYPE "public"."message_blast_status_enum" AS ENUM('draft', 'sent', 'failed');--> statement-breakpoint
ALTER TABLE "message_blasts" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."message_blast_status_enum";--> statement-breakpoint
ALTER TABLE "message_blasts" ALTER COLUMN "status" SET DATA TYPE "public"."message_blast_status_enum" USING "status"::"public"."message_blast_status_enum";--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "status" SET DEFAULT 'Pending'::text;--> statement-breakpoint
DROP TYPE "public"."report_status_enum";--> statement-breakpoint
CREATE TYPE "public"."report_status_enum" AS ENUM('Pending', 'Assigned', 'Resolved');--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "status" SET DEFAULT 'Pending'::"public"."report_status_enum";--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "status" SET DATA TYPE "public"."report_status_enum" USING "status"::"public"."report_status_enum";--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "namespace" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."role_namespace_enum";--> statement-breakpoint
CREATE TYPE "public"."role_namespace_enum" AS ENUM('global', 'channel', 'mentor', 'broadcast', 'reporting');--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "namespace" SET DATA TYPE "public"."role_namespace_enum" USING "namespace"::"public"."role_namespace_enum";--> statement-breakpoint
DROP INDEX "ix_message_blasts_scheduled_at";--> statement-breakpoint
DROP INDEX "ix_reports_status";--> statement-breakpoint
DROP INDEX "ix_reports_created_at";--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "report_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "report_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "report_id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "channel_subscriptions" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "mentees" ADD COLUMN "position_type" "position_type_enum";--> statement-breakpoint
ALTER TABLE "mentees" ADD COLUMN "service_type" "service_type_enum";--> statement-breakpoint
ALTER TABLE "mentees" ADD COLUMN "detailed_position" text;--> statement-breakpoint
ALTER TABLE "mentees" ADD COLUMN "detailed_rank" text;--> statement-breakpoint
ALTER TABLE "mentees" ADD COLUMN "resume_file_id" uuid;--> statement-breakpoint
ALTER TABLE "mentees" ADD COLUMN "personal_interests" text;--> statement-breakpoint
ALTER TABLE "mentees" ADD COLUMN "role_model_inspiration" text;--> statement-breakpoint
ALTER TABLE "mentees" ADD COLUMN "hope_to_gain_responses" jsonb;--> statement-breakpoint
ALTER TABLE "mentees" ADD COLUMN "mentor_qualities" jsonb;--> statement-breakpoint
ALTER TABLE "mentees" ADD COLUMN "preferred_meeting_format" "meeting_format_enum";--> statement-breakpoint
ALTER TABLE "mentees" ADD COLUMN "hours_per_month_commitment" integer;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "position_type" "position_type_enum";--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "service_type" "service_type_enum";--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "detailed_position" text;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "detailed_rank" text;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "resume_file_id" uuid;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "strengths" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "personal_interests" text;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "why_interested_responses" jsonb;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "career_advice" text;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "preferred_mentee_career_stages" jsonb;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "preferred_meeting_format" "meeting_format_enum";--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "hours_per_month_commitment" integer;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "message_blasts" ADD COLUMN "valid_until" timestamp DEFAULT NOW() + INTERVAL '24 hours' NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "category" "report_category_enum";--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "submitted_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "assigned_to" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "assigned_by" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "resolved" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "rank" text;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_used_by_user_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_embeddings" ADD CONSTRAINT "mentorship_embeddings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_messages_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("message_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_file_id_files_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("file_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_attachments" ADD CONSTRAINT "report_attachments_report_id_reports_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("report_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_attachments" ADD CONSTRAINT "report_attachments_file_id_files_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("file_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_invite_codes_code" ON "invite_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ix_invite_codes_created_by" ON "invite_codes" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "ix_invite_codes_used_by" ON "invite_codes" USING btree ("used_by");--> statement-breakpoint
CREATE INDEX "ix_invite_codes_expires_at" ON "invite_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_mentorship_embeddings_user_type" ON "mentorship_embeddings" USING btree ("user_id","user_type");--> statement-breakpoint
CREATE INDEX "ix_mentorship_embeddings_user_id" ON "mentorship_embeddings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ix_mentorship_embeddings_user_type" ON "mentorship_embeddings" USING btree ("user_type");--> statement-breakpoint
CREATE INDEX "ix_message_attachments_message_id" ON "message_attachments" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "ix_message_attachments_file_id" ON "message_attachments" USING btree ("file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_message_attachments_message_file" ON "message_attachments" USING btree ("message_id","file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_push_subscriptions_endpoint" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "ix_push_subscriptions_user_id" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_report_attachments_report_file" ON "report_attachments" USING btree ("report_id","file_id");--> statement-breakpoint
CREATE INDEX "ix_report_attachments_report_id" ON "report_attachments" USING btree ("report_id");--> statement-breakpoint
ALTER TABLE "mentees" ADD CONSTRAINT "mentees_resume_file_id_files_file_id_fk" FOREIGN KEY ("resume_file_id") REFERENCES "public"."files"("file_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_resume_file_id_files_file_id_fk" FOREIGN KEY ("resume_file_id") REFERENCES "public"."files"("file_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_channel_subscriptions_user_channel" ON "channel_subscriptions" USING btree ("user_id","channel_id");--> statement-breakpoint
CREATE INDEX "ix_mentees_resume_file_id" ON "mentees" USING btree ("resume_file_id");--> statement-breakpoint
CREATE INDEX "ix_mentors_status" ON "mentors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ix_mentors_resume_file_id" ON "mentors" USING btree ("resume_file_id");--> statement-breakpoint
CREATE INDEX "ix_message_blasts_valid_until" ON "message_blasts" USING btree ("valid_until");--> statement-breakpoint
ALTER TABLE "channel_subscriptions" DROP COLUMN "permission";--> statement-breakpoint
ALTER TABLE "message_blasts" DROP COLUMN "scheduled_at";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "summary";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "comments";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "issued_to";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "clearance_level";