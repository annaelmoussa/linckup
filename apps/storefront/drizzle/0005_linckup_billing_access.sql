ALTER TYPE "public"."linckup_subscription_status" ADD VALUE IF NOT EXISTS 'incomplete';
--> statement-breakpoint
ALTER TYPE "public"."linckup_subscription_status" ADD VALUE IF NOT EXISTS 'past_due';
--> statement-breakpoint
ALTER TYPE "public"."linckup_subscription_status" ADD VALUE IF NOT EXISTS 'unpaid';
--> statement-breakpoint
ALTER TABLE "linckup_merchants" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
--> statement-breakpoint
ALTER TABLE "linckup_merchants" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
--> statement-breakpoint
ALTER TABLE "linckup_merchants" ADD COLUMN IF NOT EXISTS "subscription_current_period_end" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "linckup_merchants" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "linckup_merchants" ADD COLUMN IF NOT EXISTS "access_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "linckup_merchants" ADD COLUMN IF NOT EXISTS "billing_status_reason" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "linckup_merchants_stripe_customer_id_unique_idx"
ON "linckup_merchants" USING btree ("stripe_customer_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "linckup_merchants_stripe_subscription_id_unique_idx"
ON "linckup_merchants" USING btree ("stripe_subscription_id");
