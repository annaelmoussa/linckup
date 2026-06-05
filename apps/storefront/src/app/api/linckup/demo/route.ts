import { NextResponse } from "next/server"

import { createDemoMerchant } from "../../../../lib/linckup/data"
import { isPublicDemoEnabled } from "../../../../lib/linckup/security"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!isPublicDemoEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { merchant, tag } = await createDemoMerchant()
  const baseUrl = new URL(request.url).origin

  return NextResponse.json({
    merchant,
    tag,
    scanUrl: `${baseUrl}/r/${tag.publicId}`,
    dashboardUrl: `${baseUrl}/dashboard`,
  })
}

export async function POST(request: Request) {
  return GET(request)
}
