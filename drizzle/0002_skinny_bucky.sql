CREATE TYPE "public"."try_on_provider" AS ENUM('mock', 'youcam');--> statement-breakpoint
ALTER TABLE "try_ons" ADD COLUMN "source_upload_id" uuid;--> statement-breakpoint
ALTER TABLE "try_ons" ADD COLUMN "provider" "try_on_provider" DEFAULT 'mock' NOT NULL;--> statement-breakpoint
ALTER TABLE "try_ons" ADD COLUMN "provider_task_id" text;--> statement-breakpoint
ALTER TABLE "try_ons" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "try_ons" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "try_ons" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "try_ons_provider_idx" ON "try_ons" USING btree ("provider");--> statement-breakpoint
ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_provider_task_id_unique" UNIQUE("provider_task_id");