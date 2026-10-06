ALTER TABLE "session_choices" DROP CONSTRAINT "session_choices_user_id_monday_weekday_pk";--> statement-breakpoint
ALTER TABLE "session_choices" ADD CONSTRAINT "session_choices_user_id_weekday_pk" PRIMARY KEY("user_id","weekday");--> statement-breakpoint
ALTER TABLE "session_choices" DROP COLUMN "monday";