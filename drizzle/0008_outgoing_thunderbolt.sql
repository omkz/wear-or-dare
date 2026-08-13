ALTER TABLE "try_ons" DROP CONSTRAINT "try_ons_session_id_sessions_id_fk";
--> statement-breakpoint
DROP INDEX "try_ons_session_id_idx";--> statement-breakpoint
ALTER TABLE "try_ons" DROP COLUMN "session_id";--> statement-breakpoint
DROP TABLE "sessions";