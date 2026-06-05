"use server"

import { revalidatePath } from "next/cache"
import { headers as nextHeaders } from "next/headers"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import Stripe from "stripe"

import { getDb } from "../../db/client"
import { merchants, reviewTargets } from "../../db/schema"
import { retrieveCustomer } from "../data/customer"
import {
  createCustomerMerchant,
  getDashboardData,
  isLinckupAccessAllowed,
} from "./data"
import {
  getPlatformConfig,
  REVIEW_PLATFORM_CONFIGS,
  REVIEW_PLATFORMS,
} from "./platforms"
import { requireOwnedMerchant } from "./security"
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

function getCountryCode(formData: FormData) {
  return formData.get("countryCode")?.toString().trim() || "fr"
}

export async function activateLinckupWorkspace(formData: FormData) {
  const countryCode = getCountryCode(formData)
  const customer = await retrieveCustomer()

  if (!customer?.email) {
    redirect(`/${countryCode}/account`)
  }

  await createCustomerMerchant(
    customer.email,
    [customer.first_name, customer.last_name].filter(Boolean).join(" "),
  )

  revalidatePath(`/${countryCode}/account`)
  redirect(`/${countryCode}/account`)
}

export async function updateMerchantSettings(formData: FormData) {
  const merchantId = requireString(formData, "merchantId")
  const countryCode = getCountryCode(formData)
  const { merchant } = await requireOwnedMerchant(merchantId)

  if (!isLinckupAccessAllowed(merchant)) {
    throw new Error("Abonnement Linckup inactif")
  }

  const db = getDb()

  await db
    .update(merchants)
    .set({
      name: clampText(requireString(formData, "name"), 120),
      businessType: clampText(requireString(formData, "businessType"), 80),
      aiEnabled: formData.get("aiEnabled") === "on",
      updatedAt: new Date(),
    })
    .where(eq(merchants.id, merchantId))

  revalidatePath(`/${countryCode}/account`)
}

export async function startLinckupSubscriptionCheckout(formData: FormData) {
  const merchantId = requireString(formData, "merchantId")
  const countryCode = getCountryCode(formData)
  const { customer, merchant } = await requireOwnedMerchant(merchantId)
  const secretKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_LINCKUP_PRICE_ID

  if (!secretKey || !priceId) {
    throw new Error("Stripe billing is not configured")
  }

  const headers = await nextHeaders()
  const origin =
    headers.get("origin") ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    `http://localhost:${process.env.PORT || 8000}`
  const stripe = new Stripe(secretKey)
  const metadata = {
    merchant_id: merchant.id,
    customer_email: customer.email,
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: merchant.id,
    customer: merchant.stripeCustomerId || undefined,
    customer_email: merchant.stripeCustomerId ? undefined : customer.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata,
    subscription_data: {
      metadata,
    },
    success_url: `${origin}/${countryCode}/account?billing=success`,
    cancel_url: `${origin}/${countryCode}/account?billing=canceled`,
  })

  if (!session.url) {
    throw new Error("Stripe checkout session URL is missing")
  }

  redirect(session.url)
}

export async function updateReviewTargets(formData: FormData) {
  const merchantId = requireString(formData, "merchantId")
  const countryCode = getCountryCode(formData)
  const { merchant } = await requireOwnedMerchant(merchantId)

  if (!isLinckupAccessAllowed(merchant)) {
    throw new Error("Abonnement Linckup inactif")
  }

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
              eq(reviewTargets.merchantId, merchantId),
            ),
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
          and(
            eq(reviewTargets.id, id),
            eq(reviewTargets.merchantId, merchantId),
          ),
        )
    } else {
      const [existingTarget] = await db
        .select({ id: reviewTargets.id })
        .from(reviewTargets)
        .where(
          and(
            eq(reviewTargets.merchantId, merchantId),
            eq(reviewTargets.platform, platform),
          ),
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

  revalidatePath(`/${countryCode}/account`)
}

export async function askGrowthAssistant(
  _state: { question?: string; answer?: string },
  formData: FormData,
) {
  const merchantId = requireString(formData, "merchantId")
  const { merchant } = await requireOwnedMerchant(merchantId)

  if (!isLinckupAccessAllowed(merchant)) {
    return {
      question: "",
      answer: "L'assistant est disponible avec un abonnement Linckup actif.",
    }
  }

  const question = clampText(requireString(formData, "question"), 500)
  const data = await getDashboardData(merchantId)
  const weeklyScans = data.metrics.weeklyScans
  const targets = data.targets
    .map(
      (target) =>
        `${target.label || target.platform}: ${target.reviewCount} avis`,
    )
    .join(", ")

  const travelPlatforms: ReviewPlatform[] = REVIEW_PLATFORM_CONFIGS.filter(
    (config) => config.internationalPreferred,
  ).map((config) => config.platform)
  const travelTarget = data.targets.find((target) =>
    travelPlatforms.includes(target.platform),
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
