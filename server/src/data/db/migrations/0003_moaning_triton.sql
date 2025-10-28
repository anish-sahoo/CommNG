CREATE TYPE "public"."channel_post_permission_enum" AS ENUM('admin', 'everyone', 'custom');--> statement-breakpoint
CREATE TABLE "message_reactions" (
	"reaction_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "message_reactions_reaction_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"message_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
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
DROP TABLE "user_devices" CASCADE;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "post_permission_level" "channel_post_permission_enum" DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("message_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_message_reactions_user" ON "message_reactions" USING btree ("message_id","user_id","emoji");--> statement-breakpoint
CREATE INDEX "ix_message_reactions_message_id" ON "message_reactions" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "ix_message_reactions_user_id" ON "message_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_push_subscriptions_endpoint" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "ix_push_subscriptions_user_id" ON "push_subscriptions" USING btree ("user_id");