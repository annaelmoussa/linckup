DELETE FROM "linckup_review_targets"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      row_number() OVER (
        PARTITION BY "merchant_id", "platform"
        ORDER BY "enabled" DESC, "updated_at" DESC, "created_at" DESC
      ) AS "row_number"
    FROM "linckup_review_targets"
  ) duplicates
  WHERE duplicates."row_number" > 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "linckup_review_targets_merchant_platform_unique_idx"
ON "linckup_review_targets" USING btree ("merchant_id", "platform");
