import "server-only"

import { getPlatformConfig } from "./platforms"
import { ReviewPlatform } from "./types"

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/i,
]

export function assertSafeDestinationUrl(value: string) {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new Error("URL invalide")
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("La destination doit utiliser HTTP ou HTTPS")
  }

  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    throw new Error("Les destinations doivent etre en HTTPS en production")
  }

  const hostname = parsed.hostname.toLowerCase()
  const isPrivateHost = PRIVATE_HOST_PATTERNS.some((pattern) =>
    pattern.test(hostname)
  )

  if (isPrivateHost && process.env.NODE_ENV === "production") {
    throw new Error("Destination interne refusee")
  }

  parsed.username = ""
  parsed.password = ""
  parsed.hash = ""

  return parsed.toString()
}

export function assertAllowedPlatformUrl(platform: ReviewPlatform, value: string) {
  const normalizedUrl = assertSafeDestinationUrl(value)
  const config = getPlatformConfig(platform)

  if (!config || config.allowedHosts.length === 0) {
    return normalizedUrl
  }

  const hostname = new URL(normalizedUrl).hostname.toLowerCase()
  const isAllowed = config.allowedHosts.some(
    (allowedHost) =>
      hostname === allowedHost || hostname.endsWith(`.${allowedHost}`)
  )

  if (!isAllowed) {
    throw new Error(`${config.label} doit pointer vers un domaine autorise`)
  }

  return normalizedUrl
}

export function clampText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength)
}
