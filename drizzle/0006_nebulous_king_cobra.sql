ALTER TABLE "try_ons" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "try_ons_user_id_idx" ON "try_ons" USING btree ("user_id");