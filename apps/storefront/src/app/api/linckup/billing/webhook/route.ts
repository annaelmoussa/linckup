import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import Stripe from "stripe"

import { getDb } from "../../../../../db/client"
import { merchants } from "../../../../../db/schema"
import { createCustomerMerchant } from "../../../../../lib/linckup/data"
import { LinckupSubscriptionStatus } from "../../../../../lib/linckup/types"

export const dynamic = "force-dynamic"

type Merchant = typeof merchants.$inferSelect

function dateFromUnix(value?: number | null) {
  return value ? new Date(value * 1000) : null
}

function getId(value: string | { id?: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id || null
}

function mapStripeStatus(status: Stripe.Subscription.Status) {
  const supported: Partial<
    Record<Stripe.Subscription.Status, LinckupSubscriptionStatus>
  > = {
    incomplete: "incomplete",
    incomplete_expired: "canceled",
    trialing: "trialing",
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "unpaid",
    paused: "paused",
  }

  return supported[status] || "incomplete"
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const legacySubscription = subscription as unknown as {
    current_period_end?: number
  }

  return legacySubscription.current_period_end || null
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const legacySubscription = (invoice as unknown as { subscription?: unknown })
    .subscription

  if (typeof legacySubscription === "string") {
    return legacySubscription
  }

  if (
    typeof legacySubscription === "object" &&
    legacySubscription &&
    "id" in legacySubscription &&
    typeof legacySubscription.id === "string"
  ) {
    return legacySubscription.id
  }

  const parentSubscription = invoice.parent?.subscription_details?.subscription

  return getId(parentSubscription)
}

function getInvoicePeriodEnd(invoice: Stripe.Invoice) {
  return invoice.lines.data.reduce<number | null>((latest, line) => {
    const end = line.period?.end || null

    if (!end) {
      return latest
    }

    return latest && latest > end ? latest : end
  }, null)
}

function getMetadataEmail(metadata?: Stripe.Metadata | null) {
  return (
    metadata?.customer_email ||
    metadata?.customerEmail ||
    metadata?.email ||
    null
  )
}

async function getStripeCustomerEmail(
  stripe: Stripe,
  stripeCustomerId?: string | null,
) {
  if (!stripeCustomerId) {
    return null
  }

  const customer = await stripe.customers.retrieve(stripeCustomerId)

  if (customer.deleted) {
    return null
  }

  return customer.email || null
}

async function findMerchant(input: {
  merchantId?: string | null
  customerEmail?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}) {
  const db = getDb()

  if (input.merchantId) {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, input.merchantId))
      .limit(1)

    if (merchant) {
      return merchant
    }
  }

  if (input.stripeSubscriptionId) {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.stripeSubscriptionId, input.stripeSubscriptionId))
      .limit(1)

    if (merchant) {
      return merchant
    }
  }

  if (input.stripeCustomerId) {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.stripeCustomerId, input.stripeCustomerId))
      .limit(1)

    if (merchant) {
      return merchant
    }
  }

  if (input.customerEmail) {
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.customerEmail, input.customerEmail))
      .limit(1)

    if (merchant) {
      return merchant
    }
  }

  return null
}

async function updateMerchantBilling(
  merchant: Merchant,
  input: {
    status: LinckupSubscriptionStatus
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
    subscriptionCurrentPeriodEnd?: Date | null
    accessExpiresAt?: Date | null
    trialEndsAt?: Date | null
    billingStatusReason?: string | null
  },
) {
  const db = getDb()

  await db
    .update(merchants)
    .set({
      subscriptionStatus: input.status,
      stripeCustomerId: input.stripeCustomerId || merchant.stripeCustomerId,
      stripeSubscriptionId:
        input.stripeSubscriptionId || merchant.stripeSubscriptionId,
      subscriptionCurrentPeriodEnd:
        input.subscriptionCurrentPeriodEnd ??
        merchant.subscriptionCurrentPeriodEnd,
      accessExpiresAt: input.accessExpiresAt ?? merchant.accessExpiresAt,
      trialEndsAt: input.trialEndsAt ?? merchant.trialEndsAt,
      billingStatusReason:
        input.billingStatusReason === undefined
          ? merchant.billingStatusReason
          : input.billingStatusReason,
      updatedAt: new Date(),
    })
    .where(eq(merchants.id, merchant.id))
}

async function getOrCreatePaidMerchant(input: {
  merchantId?: string | null
  customerEmail?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}) {
  const existing = await findMerchant(input)

  if (existing || !input.customerEmail) {
    return existing
  }

  const { merchant } = await createCustomerMerchant(input.customerEmail)
  return merchant || null
}

async function handleSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription,
) {
  const status = mapStripeStatus(subscription.status)
  const stripeCustomerId = getId(subscription.customer)
  const stripeSubscriptionId = subscription.id
  const customerEmail =
    getMetadataEmail(subscription.metadata) ||
    (await getStripeCustomerEmail(stripe, stripeCustomerId))
  const merchantId = subscription.metadata?.merchant_id || null
  const periodEnd = dateFromUnix(getSubscriptionPeriodEnd(subscription))
  const trialEnd = dateFromUnix(subscription.trial_end)
  const accessExpiresAt =
    status === "active" || status === "trialing" ? periodEnd || trialEnd : null

  const merchant = await getOrCreatePaidMerchant({
    merchantId,
    customerEmail,
    stripeCustomerId,
    stripeSubscriptionId,
  })

  if (!merchant) {
    return
  }

  await updateMerchantBilling(merchant, {
    status,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionCurrentPeriodEnd: periodEnd,
    accessExpiresAt,
    trialEndsAt: trialEnd,
    billingStatusReason: null,
  })
}

async function handleInvoicePaid(stripe: Stripe, invoice: Stripe.Invoice) {
  const stripeCustomerId = getId(invoice.customer)
  const stripeSubscriptionId = getInvoiceSubscriptionId(invoice)
  const customerEmail =
    getMetadataEmail(invoice.metadata) ||
    invoice.customer_email ||
    (await getStripeCustomerEmail(stripe, stripeCustomerId))
  const merchantId = invoice.metadata?.merchant_id || null
  const periodEnd = dateFromUnix(getInvoicePeriodEnd(invoice))
  const merchant = await getOrCreatePaidMerchant({
    merchantId,
    customerEmail,
    stripeCustomerId,
    stripeSubscriptionId,
  })

  if (!merchant) {
    return
  }

  await updateMerchantBilling(merchant, {
    status: "active",
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionCurrentPeriodEnd: periodEnd,
    accessExpiresAt: periodEnd,
    billingStatusReason: null,
  })
}

async function handleInvoicePaymentFailed(
  stripe: Stripe,
  invoice: Stripe.Invoice,
) {
  const stripeCustomerId = getId(invoice.customer)
  const stripeSubscriptionId = getInvoiceSubscriptionId(invoice)
  const customerEmail =
    getMetadataEmail(invoice.metadata) ||
    invoice.customer_email ||
    (await getStripeCustomerEmail(stripe, stripeCustomerId))
  const merchantId = invoice.metadata?.merchant_id || null
  const merchant = await findMerchant({
    merchantId,
    customerEmail,
    stripeCustomerId,
    stripeSubscriptionId,
  })

  if (!merchant) {
    return
  }

  await updateMerchantBilling(merchant, {
    status: "past_due",
    stripeCustomerId,
    stripeSubscriptionId,
    billingStatusReason:
      "Le dernier paiement de l'abonnement Linckup a échoué.",
  })
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get("stripe-signature")

  if (!secretKey || !webhookSecret || !signature) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 400 },
    )
  }

  const stripe = new Stripe(secretKey)
  const rawBody = await request.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscription(stripe, event.data.object as Stripe.Subscription)
      break
    case "invoice.paid":
    case "invoice.payment_succeeded":
      await handleInvoicePaid(stripe, event.data.object as Stripe.Invoice)
      break
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(
        stripe,
        event.data.object as Stripe.Invoice,
      )
      break
    default:
      break
  }

  return NextResponse.json({ received: true })
}
