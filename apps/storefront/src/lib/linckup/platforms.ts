import { ReviewPlatform } from "./types"

export type ReviewPlatformConfig = {
  platform: ReviewPlatform
  label: string
  defaultPriority: number
  internationalPreferred?: boolean
  allowedHosts: string[]
}

export const REVIEW_PLATFORM_CONFIGS = [
  {
    platform: "google",
    label: "Google Avis",
    defaultPriority: 10,
    internationalPreferred: false,
    allowedHosts: ["google.com", "g.page", "search.google.com"],
  },
  {
    platform: "tripadvisor",
    label: "TripAdvisor",
    defaultPriority: 20,
    internationalPreferred: true,
    allowedHosts: ["tripadvisor.fr", "tripadvisor.com"],
  },
  {
    platform: "booking",
    label: "Booking",
    defaultPriority: 30,
    internationalPreferred: true,
    allowedHosts: ["booking.com"],
  },
  {
    platform: "custom",
    label: "Lien custom",
    defaultPriority: 100,
    internationalPreferred: false,
    allowedHosts: [],
  },
] as const satisfies ReviewPlatformConfig[]

export const REVIEW_PLATFORMS = REVIEW_PLATFORM_CONFIGS.map(
  (config) => config.platform
)

export function getPlatformConfig(platform: ReviewPlatform) {
  return REVIEW_PLATFORM_CONFIGS.find((config) => config.platform === platform)
}
