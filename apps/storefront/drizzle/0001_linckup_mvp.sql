CREATE TYPE "public"."linckup_subscription_status" AS ENUM('trialing', 'active', 'paused', 'canceled');--> statement-breakpoint
ALTER TABLE "linckup_merchants" ADD COLUMN "customer_email" text;--> statement-breakpoint
ALTER TABLE "linckup_merchants" ADD COLUMN "business_type" text DEFAULT 'commerce' NOT NULL;--> statement-breakpoint
ALTER TABLE "linckup_merchants" ADD COLUMN "subscription_status" "linckup_subscription_status" DEFAULT 'trialing' NOT NULL;--> statement-breakpoint
ALTER TABLE "linckup_merchants" ADD COLUMN "ai_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "linckup_review_targets" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "linckup_review_targets" ADD COLUMN "review_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "linckup_review_targets" ADD COLUMN "enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "linckup_scan_events" ADD COLUMN "review_target_id" uuid;--> statement-breakpoint
ALTER TABLE "linckup_scan_events" ADD COLUMN "platform" "linckup_review_platform";--> statement-breakpoint
ALTER TABLE "linckup_scan_events" ADD CONSTRAINT "linckup_scan_events_review_target_id_linckup_review_targets_id_fk" FOREIGN KEY ("review_target_id") REFERENCES "public"."linckup_review_targets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "linckup_scan_events_review_target_id_idx" ON "linckup_scan_events" USING btree ("review_target_id");
