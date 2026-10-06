CREATE TABLE "intervals_connections" (
	"user_id" text PRIMARY KEY NOT NULL,
	"api_key_encrypted" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "intervals_connections" ADD CONSTRAINT "intervals_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;