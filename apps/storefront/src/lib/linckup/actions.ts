"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"

import { getDb } from "../../db/client"
import { merchants, reviewTargets } from "../../db/schema"
import { createDemoMerchant, getDashboardData } from "./data"
import {
  getPlatformConfig,
  REVIEW_PLATFORM_CONFIGS,
  REVIEW_PLATFORMS,
} from "./platforms"
import { isPublicDemoEnabled, requireOwnedMerchant } from "./security"
import { ReviewPlatform } from "./types"
import { assertAllowedPlatformUrl, clampText } from "./validation"

function requireString(formData: FormData, key: string) {
  const value = formData.get(key)?.toString().trim()

  if (!value) {
    throw new Error(`${key} is required`)
  }

  return value
}

function parseReviewCount(formData: FormData, key: string) {
  const value = Number(formData.get(key) || 0)
  return Number.isFinite(value) && value >= 0
    ? Math.min(Math.round(value), 1_000_000)
    : 0
}

function parseSubscriptionStatus(value: FormDataEntryValue | null) {
  if (
    value === "trialing" ||
    value === "active" ||
    value === "paused" ||
    value === "canceled"
  ) {
    return value
  }

  throw new Error("Statut SaaS invalide")
}

export async function createDemoWorkspace() {
  if (!isPublicDemoEnabled()) {
    redirect("/fr/account")
  }

  await createDemoMerchant()
  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function updateMerchantSettings(formData: FormData) {
  const merchantId = requireString(formData, "merchantId")
  await requireOwnedMerchant(merchantId)

  const db = getDb()

  await db
    .update(merchants)
    .set({
      name: clampText(requireString(formData, "name"), 120),
      businessType: clampText(requireString(formData, "businessType"), 80),
      subscriptionStatus: parseSubscriptionStatus(
        formData.get("subscriptionStatus")
      ),
      aiEnabled: formData.get("aiEnabled") === "on",
      updatedAt: new Date(),
    })
    .where(eq(merchants.id, merchantId))

  revalidatePath("/dashboard")
}

export async function updateReviewTargets(formData: FormData) {
  const merchantId = requireString(formData, "merchantId")
  await requireOwnedMerchant(merchantId)

  const db = getDb()

  for (const platform of REVIEW_PLATFORMS) {
    const id = formData.get(`${platform}Id`)?.toString()
    const rawUrl = formData.get(`${platform}Url`)?.toString().trim()
    const platformConfig = getPlatformConfig(platform)

    if (!platformConfig) {
      continue
    }

    if (!rawUrl) {
      if (id) {
        await db
          .update(reviewTargets)
          .set({ enabled: false, updatedAt: new Date() })
          .where(
            and(
              eq(reviewTargets.id, id),
              eq(reviewTargets.merchantId, merchantId)
            )
          )
      }

      continue
    }

    const payload = {
      platform,
      label: platformConfig.label,
      url: assertAllowedPlatformUrl(platform, rawUrl),
      priority: platformConfig.defaultPriority,
      reviewCount: parseReviewCount(formData, `${platform}ReviewCount`),
      enabled: formData.get(`${platform}Enabled`) === "on",
      updatedAt: new Date(),
    }

    if (id) {
      await db
        .update(reviewTargets)
        .set(payload)
        .where(
          and(eq(reviewTargets.id, id), eq(reviewTargets.merchantId, merchantId))
        )
    } else {
      const [existingTarget] = await db
        .select({ id: reviewTargets.id })
        .from(reviewTargets)
        .where(
          and(
            eq(reviewTargets.merchantId, merchantId),
            eq(reviewTargets.platform, platform)
          )
        )
        .limit(1)

      if (existingTarget) {
        await db
          .update(reviewTargets)
          .set(payload)
          .where(eq(reviewTargets.id, existingTarget.id))
      } else {
        await db.insert(reviewTargets).values({
          ...payload,
          merchantId,
        })
      }
    }
  }

  revalidatePath("/dashboard")
}

export async function askGrowthAssistant(
  _state: { question?: string; answer?: string },
  formData: FormData
) {
  const merchantId = requireString(formData, "merchantId")
  await requireOwnedMerchant(merchantId)

  const question = clampText(requireString(formData, "question"), 500)
  const data = await getDashboardData(merchantId)
  const weeklyScans = data.metrics.weeklyScans
  const targets = data.targets
    .map((target) => `${target.label || target.platform}: ${target.reviewCount} avis`)
    .join(", ")

  const travelPlatforms: ReviewPlatform[] = REVIEW_PLATFORM_CONFIGS.filter(
    (config) => config.internationalPreferred
  ).map((config) => config.platform)
  const travelTarget = data.targets.find((target) =>
    travelPlatforms.includes(target.platform)
  )
  const google = data.targets.find((target) => target.platform === "google")
  const advice =
    travelTarget && google && travelTarget.reviewCount < google.reviewCount
      ? `Continue de demander l'avis au moment du paiement et laisse le routage pousser les visiteurs internationaux vers ${travelTarget.label || travelTarget.platform}.`
      : "Les volumes sont equilibres. Garde Google prioritaire pour les clients locaux et surveille les scans par equipe."

  return {
    question,
    answer: `Cette semaine, Linckup a mesure ${weeklyScans} scans. Etat des plateformes: ${targets || "aucune destination configuree"}. ${advice}`,
  }
}
