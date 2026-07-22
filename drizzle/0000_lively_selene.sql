CREATE TYPE "public"."try_on_decision" AS ENUM('wear', 'dare');--> statement-breakpoint
CREATE TYPE "public"."try_on_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(160) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "try_ons" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" varchar(160) NOT NULL,
	"challenge_id" varchar(32) NOT NULL,
	"garment_id" varchar(32) NOT NULL,
	"status" "try_on_status" DEFAULT 'pending' NOT NULL,
	"result_image_url" text DEFAULT '' NOT NULL,
	"verdict" text NOT NULL,
	"decision" "try_on_decision",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "try_ons_session_id_idx" ON "try_ons" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "try_ons_status_idx" ON "try_ons" USING btree ("status");