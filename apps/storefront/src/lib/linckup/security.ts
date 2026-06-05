import "server-only"

import { notFound, redirect } from "next/navigation"

import { retrieveCustomer } from "../data/customer"
import { getMerchantForCustomer } from "./data"

export async function requireOwnedMerchant(merchantId: string) {
  const customer = await retrieveCustomer()

  if (!customer?.email) {
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

  redirect("/fr/account")
}
