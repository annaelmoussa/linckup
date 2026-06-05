import "server-only"

import { and, count, desc, eq, gte, sql } from "drizzle-orm"

import { getDb } from "../../db/client"
import { merchants, nfcTags, reviewTargets, scanEvents } from "../../db/schema"
import { REVIEW_PLATFORM_CONFIGS } from "./platforms"
import { chooseReviewTarget } from "./routing"
import { assertSafeDestinationUrl } from "./validation"
import { LinckupTargetForm, ReviewPlatform } from "./types"

export type LinckupDashboardData = Awaited<ReturnType<typeof getDashboardData>>

const DEFAULT_TARGETS: LinckupTargetForm[] = [
  {
    platform: "google",
    label: REVIEW_PLATFORM_CONFIGS.find((config) => config.platform === "google")!
      .label,
    url: "https://www.google.com/search?q=Linckup+avis",
    reviewCount: 18,
    enabled: true,
  },
  {
    platform: "tripadvisor",
    label: REVIEW_PLATFORM_CONFIGS.find(
      (config) => config.platform === "tripadvisor"
    )!.label,
    url: "https://www.tripadvisor.fr/",
    reviewCount: 3,
    enabled: true,
  },
]

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48)
}

export function buildPublicTagId(name: string) {
  const slug = slugify(name) || "commerce"
  return `${slug}-demo`
}

export async function createDemoMerchant(customerEmail?: string | null) {
  const db = getDb()
  const publicId = buildPublicTagId(customerEmail || "linckup")
  const slug = publicId.replace(/-demo$/, "")

  const [existingTag] = await db
    .select()
    .from(nfcTags)
    .where(eq(nfcTags.publicId, publicId))
    .limit(1)

  if (existingTag) {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, existingTag.merchantId))
      .limit(1)

    return { merchant, tag: existingTag }
  }

  const [merchant] = await db
    .insert(merchants)
    .values({
      name: "Commerce Demo Linckup",
      slug,
      customerEmail: customerEmail || "demo@linckup.local",
      businessType: "restaurant",
      subscriptionStatus: "active",
      settings: {
        goal: "Reequilibrer TripAdvisor sans perdre Google.",
      },
    })
    .returning()

  const [tag] = await db
    .insert(nfcTags)
    .values({
      merchantId: merchant.id,
      publicId,
      status: "active",
    })
    .returning()

  await db.insert(reviewTargets).values(
    DEFAULT_TARGETS.map((target, index) => ({
      merchantId: merchant.id,
      platform: target.platform,
      label: target.label,
      url: target.url,
      priority: (index + 1) * 10,
      reviewCount: target.reviewCount,
      enabled: target.enabled,
    }))
  )

  return { merchant, tag }
}

export async function getMerchantForCustomer(customerEmail?: string | null) {
  if (!customerEmail) {
    return null
  }

  const db = getDb()
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.customerEmail, customerEmail))
    .limit(1)

  return merchant || null
}

export async function getMerchantById(merchantId: string) {
  const db = getDb()
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1)

  return merchant || null
}

export async function getFirstMerchant() {
  const db = getDb()
  const [merchant] = await db
    .select()
    .from(merchants)
    .orderBy(desc(merchants.createdAt))
    .limit(1)

  return merchant || null
}

export async function getMerchantByTag(publicId: string) {
  const db = getDb()
  const [tag] = await db
    .select()
    .from(nfcTags)
    .where(eq(nfcTags.publicId, publicId))
    .limit(1)

  if (!tag) {
    return null
  }

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, tag.merchantId))
    .limit(1)

  if (!merchant) {
    return null
  }

  return { merchant, tag }
}

export async function getDashboardData(merchantId: string) {
  const db = getDb()
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1)

  const tags = await db
    .select()
    .from(nfcTags)
    .where(eq(nfcTags.merchantId, merchantId))

  const targets = await db
    .select()
    .from(reviewTargets)
    .where(eq(reviewTargets.merchantId, merchantId))
    .orderBy(reviewTargets.priority)

  const totalScans = await db
    .select({ value: count() })
    .from(scanEvents)
    .where(eq(scanEvents.merchantId, merchantId))

  const weeklyScans = await db
    .select({ value: count() })
    .from(scanEvents)
    .where(and(eq(scanEvents.merchantId, merchantId), gte(scanEvents.createdAt, since)))

  const scansByPlatform = await db
    .select({
      platform: scanEvents.platform,
      value: count(),
    })
    .from(scanEvents)
    .where(eq(scanEvents.merchantId, merchantId))
    .groupBy(scanEvents.platform)

  const recentEvents = await db
    .select()
    .from(scanEvents)
    .where(eq(scanEvents.merchantId, merchantId))
    .orderBy(desc(scanEvents.createdAt))
    .limit(12)

  const recentScansByTarget = await db
    .select({
      targetId: scanEvents.reviewTargetId,
      value: count(),
    })
    .from(scanEvents)
    .where(and(eq(scanEvents.merchantId, merchantId), gte(scanEvents.createdAt, since)))
    .groupBy(scanEvents.reviewTargetId)

  return {
    merchant,
    tags,
    targets,
    recentEvents,
    metrics: {
      totalScans: totalScans[0]?.value || 0,
      weeklyScans: weeklyScans[0]?.value || 0,
      scansByPlatform,
      recentScansByTarget,
    },
  }
}

function normalizeStoredHeader(value: string | null, fallback: string) {
  return value?.slice(0, 300).trim() || fallback
}

export async function resolveScanDestination(
  publicId: string,
  languageHeader: string | null,
  userAgent: string | null
) {
  const db = getDb()
  const entity = await getMerchantByTag(publicId)

  if (!entity || entity.tag.status !== "active") {
    return null
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const targets = await db
    .select({
      id: reviewTargets.id,
      platform: reviewTargets.platform,
      url: reviewTargets.url,
      priority: reviewTargets.priority,
      reviewCount: reviewTargets.reviewCount,
      enabled: reviewTargets.enabled,
      recentScans:
        sql<number>`count(${scanEvents.id}) filter (where ${scanEvents.createdAt} >= ${since})`.mapWith(
          Number
        ),
    })
    .from(reviewTargets)
    .leftJoin(scanEvents, eq(scanEvents.reviewTargetId, reviewTargets.id))
    .where(eq(reviewTargets.merchantId, entity.merchant.id))
    .groupBy(reviewTargets.id)

  const choice = chooseReviewTarget(targets, languageHeader)
  const target = choice?.target
  const rawDestinationUrl =
    target?.url || process.env.DEFAULT_REVIEW_URL || "https://www.google.com"
  const destinationUrl = assertSafeDestinationUrl(rawDestinationUrl)

  await db.insert(scanEvents).values({
    nfcTagId: entity.tag.id,
    reviewTargetId: target?.id,
    merchantId: entity.merchant.id,
    language: normalizeStoredHeader(
      languageHeader?.split(",")[0] || null,
      "unknown"
    ),
    platform: target?.platform as ReviewPlatform | undefined,
    destinationUrl,
    userAgent: normalizeStoredHeader(userAgent, "unknown"),
  })

  return {
    destinationUrl,
    merchant: entity.merchant,
    tag: entity.tag,
    target,
    reason: choice?.reason || "Destination par defaut.",
  }
}
