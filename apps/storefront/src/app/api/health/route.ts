import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"

import { getDb } from "../../../db/client"

export const dynamic = "force-dynamic"

export async function GET() {
  const startedAt = Date.now()
  const checks = {
    storefront: "ok",
    database: "unknown",
    medusa: "unknown",
  }

  try {
    await getDb().execute(sql`select 1`)
    checks.database = "ok"
  } catch {
    checks.database = "error"
  }

  const medusaUrl =
    process.env.MEDUSA_BACKEND_URL_INTERNAL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    "http://localhost:9000"

  try {
    const response = await fetch(`${medusaUrl}/health`, { cache: "no-store" })
    checks.medusa = response.ok ? "ok" : `error:${response.status}`
  } catch {
    checks.medusa = "error"
  }

  const ok = checks.database === "ok" && checks.medusa === "ok"

  return NextResponse.json(
    {
      ok,
      checks,
      latencyMs: Date.now() - startedAt,
    },
    { status: ok ? 200 : 503 }
  )
}
