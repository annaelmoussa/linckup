export type ReviewPlatform = "google" | "tripadvisor" | "booking" | "custom"

export type LinckupSubscriptionStatus =
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "unpaid"
  | "paused"
  | "canceled"

export type LinckupTargetForm = {
  platform: ReviewPlatform
  label: string
  url: string
  reviewCount: number
  enabled: boolean
}
