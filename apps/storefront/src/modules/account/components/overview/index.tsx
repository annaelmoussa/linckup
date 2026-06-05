import { Container } from "@modules/common/components/ui"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { LinckupDashboardData } from "@lib/linckup/data"
import LinckupWorkspace from "../linckup-workspace"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
  linckupData: LinckupDashboardData | null
  countryCode: string
}

const Overview = ({
  customer,
  orders,
  linckupData,
  countryCode,
}: OverviewProps) => {
  const recentOrders = orders?.slice(0, 5) || []

  return (
    <div className="grid gap-8 px-4 small:px-0" data-testid="overview-page-wrapper">
      <section className="grid gap-4">
        <div className="flex flex-col gap-2 small:flex-row small:items-end small:justify-between">
          <div>
            <p className="text-small-semi uppercase text-ui-fg-subtle">
              Mon compte
            </p>
            <h1
              className="mt-1 text-xl-semi"
              data-testid="welcome-message"
              data-value={customer?.first_name}
            >
              Bonjour {customer?.first_name || "Linckup"}
            </h1>
          </div>
          <p className="text-small-regular text-ui-fg-subtle">
            Connecté en tant que{" "}
            <span
              className="font-semibold text-ui-fg-base"
              data-testid="customer-email"
              data-value={customer?.email}
            >
              {customer?.email}
            </span>
          </p>
        </div>

        <div className="grid gap-3 small:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-large-semi">Profil</h2>
            <div className="mt-3 flex items-end gap-x-2">
              <span
                className="text-3xl-semi leading-none"
                data-testid="customer-profile-completion"
                data-value={getProfileCompletion(customer)}
              >
                {getProfileCompletion(customer)}%
              </span>
              <span className="uppercase text-base-regular text-ui-fg-subtle">
                complété
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-large-semi">Adresses</h2>
            <div className="mt-3 flex items-end gap-x-2">
              <span
                className="text-3xl-semi leading-none"
                data-testid="addresses-count"
                data-value={customer?.addresses?.length || 0}
              >
                {customer?.addresses?.length || 0}
              </span>
              <span className="uppercase text-base-regular text-ui-fg-subtle">
                enregistrées
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-large-semi">Commandes</h2>
            <div className="mt-3 flex items-end gap-x-2">
              <span
                className="text-3xl-semi leading-none"
                data-testid="orders-count"
                data-value={orders?.length || 0}
              >
                {orders?.length || 0}
              </span>
              <span className="uppercase text-base-regular text-ui-fg-subtle">
                passées
              </span>
            </div>
          </div>
        </div>
      </section>

      <LinckupWorkspace
        data={linckupData}
        hasOrders={recentOrders.length > 0}
        countryCode={countryCode}
      />

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-large-semi">Commandes récentes</h2>
          <LocalizedClientLink
            href="/account/orders"
            className="text-small-semi text-ui-fg-subtle hover:text-ui-fg-base"
          >
            Tout voir
          </LocalizedClientLink>
        </div>
        <ul className="flex flex-col gap-y-4" data-testid="orders-wrapper">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <li
                key={order.id}
                data-testid="order-wrapper"
                data-value={order.id}
              >
                <LocalizedClientLink
                  href={`/account/orders/details/${order.id}`}
                >
                  <Container className="flex items-center justify-between bg-gray-50 p-4">
                    <div className="grid flex-1 gap-2 text-small-regular small:grid-cols-3 small:gap-x-4">
                      <div>
                        <span className="block font-semibold">
                          Date de commande
                        </span>
                        <span data-testid="order-created-date">
                          {new Intl.DateTimeFormat("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }).format(new Date(order.created_at))}
                        </span>
                      </div>
                      <div>
                        <span className="block font-semibold">
                          Numéro de commande
                        </span>
                        <span data-testid="order-id" data-value={order.display_id}>
                          #{order.display_id}
                        </span>
                      </div>
                      <div>
                        <span className="block font-semibold">Montant total</span>
                        <span data-testid="order-amount">
                          {convertToLocale({
                            amount: order.total,
                            currency_code: order.currency_code,
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      className="flex size-10 items-center justify-center"
                      data-testid="open-order-button"
                    >
                      <span className="sr-only">
                        Voir la commande #{order.display_id}
                      </span>
                      <ChevronDown className="-rotate-90" />
                    </button>
                  </Container>
                </LocalizedClientLink>
              </li>
            ))
          ) : (
            <li className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-base-regular text-ui-fg-subtle" data-testid="no-orders-message">
              Aucune commande récente.
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
