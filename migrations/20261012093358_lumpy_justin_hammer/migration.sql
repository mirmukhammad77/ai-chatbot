ALTER TYPE "message_status_enum" ADD VALUE 'streaming' BEFORE 'completed';--> statement-breakpoint
ALTER TYPE "message_status_enum" ADD VALUE 'cancelled';--> statement-breakpoint
DROP INDEX "conversations_user_id_unique";--> statement-breakpoint
DROP INDEX "messages_conversation_id";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "sequence" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "conversations_user_id_idx" ON "conversations" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_conversation_sequence_unique" ON "messages" ("conversation_id","sequence");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_input_tokens_nonnegative" CHECK ("input_tokens" >= 0);--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_output_tokens_nonnegative" CHECK ("output_tokens" >= 0);--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_total_tokens_nonnegative" CHECK ("total_tokens" >= 0);