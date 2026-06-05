import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { getDashboardData, getMerchantForCustomer } from "@lib/linckup/data"

export const metadata: Metadata = {
  title: "Compte",
  description: "Commandes, profil et dashboard Linckup.",
}

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function OverviewTemplate(props: Props) {
  const params = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  const orders = (await listOrders().catch(() => null)) || null
  const merchant = customer?.email
    ? await getMerchantForCustomer(customer.email).catch(() => null)
    : null
  const linckupData = merchant
    ? await getDashboardData(merchant.id).catch(() => null)
    : null

  if (!customer) {
    notFound()
  }

  return (
    <Overview
      customer={customer}
      orders={orders}
      linckupData={linckupData}
      countryCode={params.countryCode}
    />
  )
}
