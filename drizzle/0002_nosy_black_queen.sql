CREATE TABLE "session_choices" (
	"user_id" text NOT NULL,
	"monday" text NOT NULL,
	"weekday" text NOT NULL,
	"rep_length" text NOT NULL,
	"reps" integer NOT NULL,
	"rep_minutes" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_choices_user_id_monday_weekday_pk" PRIMARY KEY("user_id","monday","weekday")
);
--> statement-breakpoint
ALTER TABLE "session_choices" ADD CONSTRAINT "session_choices_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;