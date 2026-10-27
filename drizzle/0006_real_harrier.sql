CREATE TABLE "scheduled_syncs" (
	"user_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean NOT NULL,
	"weekday" text NOT NULL,
	"hour" integer NOT NULL,
	"time_zone" text NOT NULL,
	"saved_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ran_at" timestamp NOT NULL,
	"monday" date NOT NULL,
	"trigger" text NOT NULL,
	"outcome" text NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "scheduled_syncs" ADD CONSTRAINT "scheduled_syncs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_records" ADD CONSTRAINT "sync_records_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sync_records_user_id_ran_at_idx" ON "sync_records" USING btree ("user_id","ran_at");