CREATE TYPE "public"."mentee_status_enum" AS ENUM('active', 'inactive', 'matched');--> statement-breakpoint
CREATE TYPE "public"."message_blast_status_enum" AS ENUM('draft', 'scheduled', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "mentees" (
	"mentee_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mentees_mentee_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"learning_goals" text,
	"experience_level" text,
	"preferred_mentor_type" text,
	"status" "mentee_status_enum" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_blasts" (
	"blast_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "message_blasts_blast_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sender_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"target_audience" jsonb,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"status" "message_blast_status_enum" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mentees" ADD CONSTRAINT "mentees_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_blasts" ADD CONSTRAINT "message_blasts_sender_id_users_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_mentees_user_id" ON "mentees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ix_mentees_status" ON "mentees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ix_message_blasts_sender_id" ON "message_blasts" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "ix_message_blasts_status" ON "message_blasts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ix_message_blasts_scheduled_at" ON "message_blasts" USING btree ("scheduled_at");