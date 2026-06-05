CREATE UNIQUE INDEX IF NOT EXISTS "linckup_merchants_customer_email_unique_idx"
ON "linckup_merchants" USING btree ("customer_email");
