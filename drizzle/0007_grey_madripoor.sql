ALTER TABLE "try_ons" DROP CONSTRAINT "try_ons_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "try_ons" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "try_ons" ADD CONSTRAINT "try_ons_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;