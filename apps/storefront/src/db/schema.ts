import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

export const nfcTagStatus = pgEnum("linckup_nfc_tag_status", [
  "active",
  "disabled",
])

export const reviewPlatform = pgEnum("linckup_review_platform", [
  "google",
  "tripadvisor",
  "booking",
  "custom",
])

export const subscriptionStatus = pgEnum("linckup_subscription_status", [
  "trialing",
  "active",
  "paused",
  "canceled",
])

export const merchants = pgTable(
  "linckup_merchants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    customerEmail: text("customer_email"),
    businessType: text("business_type").default("commerce").notNull(),
    subscriptionStatus: subscriptionStatus("subscription_status")
      .default("trialing")
      .notNull(),
    aiEnabled: boolean("ai_enabled").default(true).notNull(),
    settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("linckup_merchants_slug_idx").on(table.slug),
    uniqueIndex("linckup_merchants_customer_email_unique_idx").on(
      table.customerEmail
    ),
  ]
)

export const nfcTags = pgTable(
  "linckup_nfc_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publicId: text("public_id").notNull().unique(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    status: nfcTagStatus("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("linckup_nfc_tags_public_id_idx").on(table.publicId),
    index("linckup_nfc_tags_merchant_id_idx").on(table.merchantId),
  ]
)

export const reviewTargets = pgTable(
  "linckup_review_targets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    platform: reviewPlatform("platform").notNull(),
    label: text("label"),
    url: text("url").notNull(),
    priority: integer("priority").default(100).notNull(),
    reviewCount: integer("review_count").default(0).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("linckup_review_targets_merchant_id_idx").on(table.merchantId),
    index("linckup_review_targets_priority_idx").on(table.priority),
    uniqueIndex("linckup_review_targets_merchant_platform_unique_idx").on(
      table.merchantId,
      table.platform
    ),
  ]
)

export const scanEvents = pgTable(
  "linckup_scan_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nfcTagId: uuid("nfc_tag_id").references(() => nfcTags.id, {
      onDelete: "set null",
    }),
    reviewTargetId: uuid("review_target_id").references(() => reviewTargets.id, {
      onDelete: "set null",
    }),
    merchantId: uuid("merchant_id").references(() => merchants.id, {
      onDelete: "set null",
    }),
    language: text("language"),
    platform: reviewPlatform("platform"),
    destinationUrl: text("destination_url").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("linckup_scan_events_nfc_tag_id_idx").on(table.nfcTagId),
    index("linckup_scan_events_review_target_id_idx").on(table.reviewTargetId),
    index("linckup_scan_events_merchant_id_idx").on(table.merchantId),
    index("linckup_scan_events_created_at_idx").on(table.createdAt),
  ]
)
