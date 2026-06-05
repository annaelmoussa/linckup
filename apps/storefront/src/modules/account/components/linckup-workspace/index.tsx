import Link from "next/link"

import { activateLinckupWorkspace } from "@lib/linckup/actions"
import { getLinckupAccessState, LinckupDashboardData } from "@lib/linckup/data"
import { REVIEW_PLATFORM_CONFIGS } from "@lib/linckup/platforms"
import { ReviewPlatform } from "@lib/linckup/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import GrowthAssistant from "@modules/linckup/growth-assistant"
import {
  startLinckupSubscriptionCheckout,
  updateMerchantSettings,
  updateReviewTargets,
} from "@lib/linckup/actions"

type LinckupWorkspaceProps = {
  data: LinckupDashboardData | null
  hasOrders: boolean
  countryCode: string
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value)
}

function getTargetMap(targets: LinckupDashboardData["targets"]) {
  return targets.reduce(
    (acc, target) => {
      acc[target.platform] = target
      return acc
    },
    {} as Partial<Record<ReviewPlatform, (typeof targets)[number]>>,
  )
}

const LinckupWorkspace = ({
  data,
  hasOrders,
  countryCode,
}: LinckupWorkspaceProps) => {
  if (!data?.merchant) {
    return (
      <section
        className="rounded-lg border border-gray-200 bg-gray-50 p-5"
        data-testid="linckup-activation-panel"
      >
        <p className="text-small-semi uppercase text-ui-fg-subtle">
          Espace Linckup
        </p>
        <h2 className="mt-2 text-xl-semi">Activez votre dashboard client</h2>
        <p className="mt-3 text-base-regular text-ui-fg-subtle">
          Votre compte centralise vos commandes, vos informations et le pilotage
          de votre plaque NFC. L&apos;activation crée le workspace lié à ce
          compte.
        </p>
        <div className="mt-5 flex flex-col gap-3 small:flex-row">
          {hasOrders ? (
            <form action={activateLinckupWorkspace}>
              <input type="hidden" name="countryCode" value={countryCode} />
              <button className="h-11 rounded-md bg-ui-fg-base px-5 text-base-semi text-ui-bg-base">
                Activer mon espace
              </button>
            </form>
          ) : (
            <LocalizedClientLink
              href="/store"
              className="inline-flex h-11 items-center rounded-md bg-ui-fg-base px-5 text-base-semi text-ui-bg-base"
            >
              Commander la plaque
            </LocalizedClientLink>
          )}
          <LocalizedClientLink
            href="/account/orders"
            className="inline-flex h-11 items-center rounded-md border border-gray-300 px-5 text-base-semi"
          >
            Voir mes commandes
          </LocalizedClientLink>
        </div>
      </section>
    )
  }

  const { merchant, tags, targets, metrics, recentEvents } = data
  const accessState = getLinckupAccessState(merchant)
  const targetMap = getTargetMap(targets)
  const primaryTag = tags[0]
  const scanPath = primaryTag ? `/r/${primaryTag.publicId}` : null

  return (
    <section className="grid gap-6" data-testid="linckup-workspace">
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5 small:flex-row small:items-end small:justify-between">
        <div>
          <p className="text-small-semi uppercase text-ui-fg-subtle">
            Espace Linckup
          </p>
          <h2 className="mt-2 text-xl-semi">Dashboard commerçant</h2>
          <p className="mt-2 max-w-2xl text-base-regular text-ui-fg-subtle">
            Gérez le commerce, le routage des avis et les scans associés à vos
            plaques depuis le même compte.
          </p>
          <p className="mt-3 text-small-regular text-ui-fg-subtle">
            {accessState.title} · {accessState.message}
          </p>
        </div>
        {scanPath && (
          <Link
            href={scanPath}
            className="inline-flex h-10 items-center justify-center rounded-md bg-ui-fg-base px-4 text-base-semi text-ui-bg-base"
          >
            Tester le scan
          </Link>
        )}
      </div>

      <div className="grid gap-3 small:grid-cols-4">
        {[
          ["Scans total", metrics.totalScans],
          ["Scans 7 jours", metrics.weeklyScans],
          ["Destinations", targets.filter((target) => target.enabled).length],
          ["Accès", accessState.allowed ? "Ouvert" : "Suspendu"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <p className="text-small-regular text-ui-fg-subtle">{label}</p>
            <p className="mt-2 text-xl-semi">{value}</p>
          </div>
        ))}
      </div>

      {!accessState.allowed && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="text-large-semi">Facturation requise</h3>
          <p className="mt-2 text-base-regular text-ui-fg-subtle">
            {accessState.message}
          </p>
          <div className="mt-4 flex flex-col gap-3 small:flex-row">
            <form action={startLinckupSubscriptionCheckout}>
              <input type="hidden" name="merchantId" value={merchant.id} />
              <input type="hidden" name="countryCode" value={countryCode} />
              <button className="h-10 rounded-md bg-ui-fg-base px-4 text-base-semi text-ui-bg-base">
                Activer l&apos;abonnement
              </button>
            </form>
            <LocalizedClientLink
              href="/account/orders"
              className="inline-flex h-10 items-center rounded-md border border-gray-300 px-4 text-base-semi"
            >
              Voir mes commandes
            </LocalizedClientLink>
          </div>
        </div>
      )}

      {accessState.allowed && (
        <>
          <div className="grid gap-5 large:grid-cols-[1fr_1.15fr]">
            <form
              action={updateMerchantSettings}
              className="rounded-lg border border-gray-200 bg-white p-5"
            >
              <input type="hidden" name="merchantId" value={merchant.id} />
              <input type="hidden" name="countryCode" value={countryCode} />
              <h3 className="text-large-semi">Commerce</h3>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2 text-base-semi">
                  Nom
                  <input
                    name="name"
                    defaultValue={merchant.name}
                    className="h-11 rounded-md border border-gray-300 px-3 text-base-regular"
                  />
                </label>
                <label className="grid gap-2 text-base-semi">
                  Type
                  <input
                    name="businessType"
                    defaultValue={merchant.businessType}
                    className="h-11 rounded-md border border-gray-300 px-3 text-base-regular"
                  />
                </label>
                <div className="grid gap-2 text-base-semi">
                  Statut d&apos;accès
                  <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-base-regular text-ui-fg-subtle">
                    {accessState.title}
                  </p>
                </div>
                <label className="flex items-center gap-3 text-base-semi">
                  <input
                    type="checkbox"
                    name="aiEnabled"
                    defaultChecked={merchant.aiEnabled}
                    className="h-4 w-4"
                  />
                  Assistant actif
                </label>
                <button className="h-11 rounded-md bg-ui-fg-base px-4 text-base-semi text-ui-bg-base">
                  Enregistrer
                </button>
              </div>
            </form>

            <form
              action={updateReviewTargets}
              className="rounded-lg border border-gray-200 bg-white p-5"
            >
              <input type="hidden" name="merchantId" value={merchant.id} />
              <input type="hidden" name="countryCode" value={countryCode} />
              <h3 className="text-large-semi">Destinations d&apos;avis</h3>
              <div className="mt-4 grid gap-4">
                {REVIEW_PLATFORM_CONFIGS.map((config) => {
                  const target = targetMap[config.platform]

                  return (
                    <fieldset
                      key={config.platform}
                      className="grid gap-3 rounded-md border border-gray-200 p-4"
                    >
                      <legend className="px-1 text-base-semi">
                        {config.label}
                      </legend>
                      <input
                        type="hidden"
                        name={`${config.platform}Id`}
                        value={target?.id || ""}
                      />
                      <label className="grid gap-2 text-small-semi">
                        URL
                        <input
                          name={`${config.platform}Url`}
                          defaultValue={target?.url || ""}
                          placeholder="https://..."
                          className="h-10 rounded-md border border-gray-300 px-3 text-base-regular"
                        />
                      </label>
                      <div className="grid gap-3 small:grid-cols-[1fr_auto]">
                        <label className="grid gap-2 text-small-semi">
                          Avis actuels
                          <input
                            name={`${config.platform}ReviewCount`}
                            type="number"
                            min="0"
                            defaultValue={target?.reviewCount || 0}
                            className="h-10 rounded-md border border-gray-300 px-3 text-base-regular"
                          />
                        </label>
                        <label className="flex items-end gap-2 pb-2 text-small-semi">
                          <input
                            type="checkbox"
                            name={`${config.platform}Enabled`}
                            defaultChecked={target?.enabled ?? false}
                            className="h-4 w-4"
                          />
                          Actif
                        </label>
                      </div>
                    </fieldset>
                  )
                })}
                <button className="h-11 rounded-md bg-ui-fg-base px-4 text-base-semi text-ui-bg-base">
                  Mettre à jour le routage
                </button>
              </div>
            </form>
          </div>

          <div className="grid gap-5 large:grid-cols-[1fr_1fr]">
            <GrowthAssistant merchantId={merchant.id} />

            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="text-large-semi">Derniers scans</h3>
              <div className="mt-4 grid gap-3">
                {recentEvents.length === 0 ? (
                  <p className="text-base-regular text-ui-fg-subtle">
                    Aucun scan pour le moment. Testez la plaque ou partagez le
                    lien de scan pour démarrer le suivi.
                  </p>
                ) : (
                  recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="grid gap-1 rounded-md border border-gray-200 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-base-semi">
                          {event.platform || "custom"}
                        </strong>
                        <span className="text-small-regular text-ui-fg-subtle">
                          {formatDate(event.createdAt)}
                        </span>
                      </div>
                      <p className="truncate text-small-regular text-ui-fg-subtle">
                        {event.language || "unknown"} vers{" "}
                        {event.destinationUrl}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  )
}

export default LinckupWorkspace
