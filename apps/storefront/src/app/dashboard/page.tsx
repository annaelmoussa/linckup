import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Dashboard Linckup",
}

export default function DashboardPage() {
  redirect("/fr/account")
}
