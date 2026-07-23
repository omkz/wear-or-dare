ALTER TABLE "try_ons" ADD COLUMN "request_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_request_id_unique" UNIQUE("request_id");