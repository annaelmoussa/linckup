import "server-only"

import { notFound, redirect } from "next/navigation"

import { retrieveCustomer } from "../data/customer"
import { getMerchantById, getMerchantForCustomer } from "./data"

export function isPublicDemoEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.LINCKUP_ENABLE_PUBLIC_DEMO !== "false"
  )
}

export async function requireOwnedMerchant(merchantId: string) {
  const customer = await retrieveCustomer()

  if (!customer?.email) {
    if (isPublicDemoEnabled()) {
      const merchant = await getMerchantById(merchantId)

      if (merchant?.customerEmail === "demo@linckup.local") {
        return { customer: null, merchant }
      }
    }

    redirect("/fr/account")
  }

  const merchant = await getMerchantForCustomer(customer.email)

  if (!merchant || merchant.id !== merchantId) {
    notFound()
  }

  return { customer, merchant }
}

export async function getDashboardMerchant() {
  const customer = await retrieveCustomer()

  if (customer?.email) {
    return getMerchantForCustomer(customer.email)
  }

  if (isPublicDemoEnabled()) {
    return null
  }

  redirect("/fr/account")
}
