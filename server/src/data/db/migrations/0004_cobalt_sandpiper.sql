CREATE TABLE "message_attachments" (
	"attachment_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "message_attachments_attachment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"message_id" integer NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_messages_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("message_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_file_id_files_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("file_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "ux_message_attachments_message_file" ON "message_attachments" USING btree ("message_id","file_id");
--> statement-breakpoint
CREATE INDEX "ix_message_attachments_message_id" ON "message_attachments" USING btree ("message_id");
--> statement-breakpoint
CREATE INDEX "ix_message_attachments_file_id" ON "message_attachments" USING btree ("file_id");
