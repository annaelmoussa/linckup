CREATE TYPE "public"."linckup_nfc_tag_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."linckup_review_platform" AS ENUM('google', 'tripadvisor', 'custom');--> statement-breakpoint
CREATE TABLE "linckup_merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "linckup_merchants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "linckup_nfc_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"merchant_id" uuid NOT NULL,
	"status" "linckup_nfc_tag_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "linckup_nfc_tags_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "linckup_review_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"platform" "linckup_review_platform" NOT NULL,
	"url" text NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linckup_scan_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nfc_tag_id" uuid,
	"merchant_id" uuid,
	"language" text,
	"destination_url" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "linckup_nfc_tags" ADD CONSTRAINT "linckup_nfc_tags_merchant_id_linckup_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."linckup_merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linckup_review_targets" ADD CONSTRAINT "linckup_review_targets_merchant_id_linckup_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."linckup_merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linckup_scan_events" ADD CONSTRAINT "linckup_scan_events_nfc_tag_id_linckup_nfc_tags_id_fk" FOREIGN KEY ("nfc_tag_id") REFERENCES "public"."linckup_nfc_tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linckup_scan_events" ADD CONSTRAINT "linckup_scan_events_merchant_id_linckup_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."linckup_merchants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "linckup_merchants_slug_idx" ON "linckup_merchants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "linckup_nfc_tags_public_id_idx" ON "linckup_nfc_tags" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "linckup_nfc_tags_merchant_id_idx" ON "linckup_nfc_tags" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "linckup_review_targets_merchant_id_idx" ON "linckup_review_targets" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "linckup_review_targets_priority_idx" ON "linckup_review_targets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "linckup_scan_events_nfc_tag_id_idx" ON "linckup_scan_events" USING btree ("nfc_tag_id");--> statement-breakpoint
CREATE INDEX "linckup_scan_events_merchant_id_idx" ON "linckup_scan_events" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "linckup_scan_events_created_at_idx" ON "linckup_scan_events" USING btree ("created_at");