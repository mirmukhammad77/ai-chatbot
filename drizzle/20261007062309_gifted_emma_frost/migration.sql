CREATE TYPE "user_roles_enum" AS ENUM('ADMIN', 'USER', 'GUEST');--> statement-breakpoint
CREATE TYPE "message_role_enum" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "message_status_enum" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL UNIQUE,
	"first_name" text,
	"last_name" text,
	"password" text NOT NULL,
	"role" "user_roles_enum" DEFAULT 'USER'::"user_roles_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"title" text,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" uuid NOT NULL,
	"role" "message_role_enum" NOT NULL,
	"content" text NOT NULL,
	"provider" varchar(50),
	"model" varchar(100),
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"finish_reason" text,
	"status" "message_status_enum" DEFAULT 'pending'::"message_status_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");--> statement-breakpoint
CREATE INDEX "conversations_user_id_unique" ON "conversations" ("user_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_id" ON "messages" ("conversation_id");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id");