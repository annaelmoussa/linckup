import { Metadata } from "next"

import LinckupLanding from "@modules/linckup/landing"

export const metadata: Metadata = {
  title: "Linckup - Booster d'avis intelligent",
  description:
    "Plaque NFC et SaaS IA pour router les clients vers Google ou TripAdvisor au bon moment.",
}

export default function Home() {
  return <LinckupLanding />
}
