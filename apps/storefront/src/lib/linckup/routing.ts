import { ReviewPlatform } from "./types"
import { REVIEW_PLATFORM_CONFIGS } from "./platforms"

type TargetInput = {
  id: string
  platform: ReviewPlatform
  url: string
  priority: number
  reviewCount: number
  enabled: boolean
  recentScans: number
}

const TRAVELER_LANGUAGES = ["en", "es", "de", "it", "nl", "pt"]

export function normalizeLanguage(language: string | null | undefined) {
  return language?.split(",")[0]?.split("-")[0]?.trim().toLowerCase() || "unknown"
}

export function isInternationalVisitor(language: string | null | undefined) {
  const normalized = normalizeLanguage(language)

  if (normalized === "unknown") {
    return false
  }

  return normalized !== "fr" && TRAVELER_LANGUAGES.includes(normalized)
}

export function chooseReviewTarget(
  targets: TargetInput[],
  language: string | null | undefined
) {
  const enabledTargets = targets.filter((target) => target.enabled)

  if (enabledTargets.length === 0) {
    return null
  }

  const internationalTarget = REVIEW_PLATFORM_CONFIGS.filter(
    (config) => config.internationalPreferred
  )
    .map((config) =>
      enabledTargets.find((target) => target.platform === config.platform)
    )
    .find(Boolean)

  if (internationalTarget && isInternationalVisitor(language)) {
    return {
      target: internationalTarget,
      reason: "Langue internationale detectee, priorite voyageur.",
    }
  }

  const rankedTargets = [...enabledTargets].sort((left, right) => {
    const leftScore = left.reviewCount + left.recentScans
    const rightScore = right.reviewCount + right.recentScans

    if (leftScore !== rightScore) {
      return leftScore - rightScore
    }

    return left.priority - right.priority
  })

  return {
    target: rankedTargets[0],
    reason: "Equilibrage automatique vers la plateforme la moins alimentee.",
  }
}
