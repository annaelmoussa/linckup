export type ReviewPlatform = "google" | "tripadvisor" | "booking" | "custom"

export type LinckupTargetForm = {
  platform: ReviewPlatform
  label: string
  url: string
  reviewCount: number
  enabled: boolean
}
