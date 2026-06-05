import Link from "next/link"

import {
  createDemoWorkspace,
  updateMerchantSettings,
  updateReviewTargets,
} from "../../lib/linckup/actions"
import {
  getDashboardData,
  getFirstMerchant,
} from "../../lib/linckup/data"
import GrowthAssistant from "../../modules/linckup/growth-assistant"
import { REVIEW_PLATFORM_CONFIGS } from "../../lib/linckup/platforms"
import {
  getDashboardMerchant,
  isPublicDemoEnabled,
} from "../../lib/linckup/security"
import { ReviewPlatform } from "../../lib/linckup/types"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Linckup Dashboard",
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value)
}

function getTargetMap(
  targets: Awaited<ReturnType<typeof getDashboardData>>["targets"]
) {
  return targets.reduce(
    (acc, target) => {
      acc[target.platform] = target
      return acc
    },
    {} as Partial<Record<ReviewPlatform, (typeof targets)[number]>>
  )
}

function rethrowNextControlFlow(error: unknown) {
  const digest =
    typeof error === "object" && error && "digest" in error
      ? String((error as { digest?: unknown }).digest)
      : ""

  if (
    digest.startsWith("NEXT_REDIRECT") ||
    digest.startsWith("NEXT_HTTP_ERROR_FALLBACK")
  ) {
    throw error
  }
}

export default async function DashboardPage() {
  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null
  let setupError: string | null = null

  try {
    const merchant =
      (await getDashboardMerchant()) ||
      (isPublicDemoEnabled() ? await getFirstMerchant() : null)

    if (merchant) {
      data = await getDashboardData(merchant.id)
    }
  } catch (error) {
    rethrowNextControlFlow(error)
    setupError =
      process.env.NODE_ENV === "production"
        ? "Configuration indisponible"
        : error instanceof Error
        ? error.message
        : "Erreur inconnue"
  }

  if (setupError) {
    return (
      <main className="min-h-screen bg-[#f6f7f3] px-6 py-10 text-[#17201b]">
        <section className="mx-auto max-w-3xl rounded-lg border border-[#d8ded2] bg-white p-6">
          <p className="text-small-semi uppercase text-[#667263]">
            Configuration requise
          </p>
          <h1 className="mt-2 text-2xl-semi">Base Linckup indisponible</h1>
          <p className="mt-3 text-base-regular text-[#5f695d]">
            Configure `DATABASE_URL`, lance les migrations Drizzle, puis reviens
            sur le dashboard. Detail technique: {setupError}
          </p>
        </section>
      </main>
    )
  }

  if (!data?.merchant) {
    return (
      <main className="min-h-screen bg-[#f6f7f3] px-6 py-10 text-[#17201b]">
        <section className="mx-auto max-w-3xl rounded-lg border border-[#d8ded2] bg-white p-6">
          <p className="text-small-semi uppercase text-[#667263]">
            Linckup SaaS
          </p>
          <h1 className="mt-2 text-3xl-semi">Creer un espace de test</h1>
          <p className="mt-3 text-base-regular text-[#5f695d]">
            Aucun commerce n&apos;est encore configure. Cree un workspace demo
            avec une plaque NFC, Google, TripAdvisor et des compteurs initiaux.
          </p>
          <form action={createDemoWorkspace} className="mt-6">
            <button className="h-11 rounded-md bg-[#062716] px-5 text-base-semi text-white">
              Creer la demo
            </button>
          </form>
        </section>
      </main>
    )
  }

  const { merchant, tags, targets, metrics, recentEvents } = data
  const targetMap = getTargetMap(targets)
  const primaryTag = tags[0]
  const scanPath = primaryTag ? `/r/${primaryTag.publicId}` : null

  return (
    <main className="min-h-screen bg-[#f6f7f3] px-6 py-8 text-[#17201b]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-5 border-b border-[#d8ded2] pb-6 medium:flex-row medium:items-end medium:justify-between">
          <div>
            <p className="text-small-semi uppercase tracking-[0.18em] text-[#667263]">
              Linckup SaaS
            </p>
            <h1 className="mt-2 text-3xl-semi">Dashboard commercant</h1>
            <p className="mt-3 max-w-2xl text-base-regular text-[#5f695d]">
              Pilotage du routage NFC, des destinations d&apos;avis et des
              signaux utiles pour l&apos;equipe.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/fr"
              className="inline-flex h-10 items-center rounded-md border border-[#cbd6cc] px-4 text-base-semi"
            >
              Landing
            </Link>
            {scanPath && (
              <Link
                href={scanPath}
                className="inline-flex h-10 items-center rounded-md bg-[#00e66b] px-4 text-base-semi text-[#062716]"
              >
                Tester le scan
              </Link>
            )}
          </div>
        </header>

        <section className="grid gap-4 small:grid-cols-4">
          {[
            ["Scans total", metrics.totalScans],
            ["Scans 7 jours", metrics.weeklyScans],
            ["Destinations", targets.filter((target) => target.enabled).length],
            ["Abonnement", merchant.subscriptionStatus],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-[#d8ded2] bg-white p-5"
            >
              <p className="text-small-regular text-[#667263]">{label}</p>
              <p className="mt-3 text-xl-semi">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 large:grid-cols-[1fr_1.15fr]">
          <form
            action={updateMerchantSettings}
            className="rounded-lg border border-[#d8ded2] bg-white p-5"
          >
            <input type="hidden" name="merchantId" value={merchant.id} />
            <h2 className="text-xl-semi">Commerce</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-base-semi">
                Nom
                <input
                  name="name"
                  defaultValue={merchant.name}
                  className="h-11 rounded-md border border-[#cbd6cc] px-3 text-base-regular"
                />
              </label>
              <label className="grid gap-2 text-base-semi">
                Type
                <input
                  name="businessType"
                  defaultValue={merchant.businessType}
                  className="h-11 rounded-md border border-[#cbd6cc] px-3 text-base-regular"
                />
              </label>
              <label className="grid gap-2 text-base-semi">
                Statut SaaS
                <select
                  name="subscriptionStatus"
                  defaultValue={merchant.subscriptionStatus}
                  className="h-11 rounded-md border border-[#cbd6cc] px-3 text-base-regular"
                >
                  <option value="trialing">Essai</option>
                  <option value="active">Actif</option>
                  <option value="paused">Pause</option>
                  <option value="canceled">Annule</option>
                </select>
              </label>
              <label className="flex items-center gap-3 text-base-semi">
                <input
                  type="checkbox"
                  name="aiEnabled"
                  defaultChecked={merchant.aiEnabled}
                  className="h-4 w-4"
                />
                Assistant actif
              </label>
              <button className="h-11 rounded-md bg-[#062716] px-4 text-base-semi text-white">
                Enregistrer
              </button>
            </div>
          </form>

          <form
            action={updateReviewTargets}
            className="rounded-lg border border-[#d8ded2] bg-white p-5"
          >
            <input type="hidden" name="merchantId" value={merchant.id} />
            <h2 className="text-xl-semi">Destinations intelligentes</h2>
            <div className="mt-5 grid gap-5">
              {REVIEW_PLATFORM_CONFIGS.map(
                (config) => {
                  const target = targetMap[config.platform]

                  return (
                    <fieldset
                      key={config.platform}
                      className="grid gap-3 rounded-md border border-[#edf0ea] p-4"
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
                          className="h-10 rounded-md border border-[#cbd6cc] px-3 text-base-regular"
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
                            className="h-10 rounded-md border border-[#cbd6cc] px-3 text-base-regular"
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
                }
              )}
              <button className="h-11 rounded-md bg-[#062716] px-4 text-base-semi text-white">
                Mettre a jour le routage
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-6 large:grid-cols-[1fr_1fr]">
          <GrowthAssistant merchantId={merchant.id} />

          <section className="rounded-lg border border-[#d8ded2] bg-white p-5">
            <h2 className="text-xl-semi">Derniers scans</h2>
            <div className="mt-4 grid gap-3">
              {recentEvents.length === 0 ? (
                <p className="text-base-regular text-[#667263]">
                  Aucun scan pour le moment. Utilise le bouton de test en haut
                  de page.
                </p>
              ) : (
                recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="grid gap-1 rounded-md border border-[#edf0ea] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-base-semi">
                        {event.platform || "custom"}
                      </strong>
                      <span className="text-small-regular text-[#667263]">
                        {formatDate(event.createdAt)}
                      </span>
                    </div>
                    <p className="truncate text-small-regular text-[#5f695d]">
                      {event.language || "unknown"} vers {event.destinationUrl}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
