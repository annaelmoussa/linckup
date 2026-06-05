import { NextRequest, NextResponse } from "next/server"

import { resolveScanDestination } from "../../../lib/linckup/data"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ tagId: string }> }
) {
  const { tagId } = await props.params

  if (!/^[a-z0-9][a-z0-9-]{2,96}$/i.test(tagId)) {
    return NextResponse.json({ error: "NFC tag not found" }, { status: 404 })
  }

  let result: Awaited<ReturnType<typeof resolveScanDestination>>

  try {
    result = await resolveScanDestination(
      tagId,
      request.headers.get("accept-language"),
      request.headers.get("user-agent")
    )
  } catch {
    return NextResponse.json(
      { error: "NFC destination unavailable" },
      { status: 502 }
    )
  }

  if (!result) {
    return NextResponse.json(
      { error: "NFC tag not found or disabled" },
      { status: 404 }
    )
  }

  return NextResponse.redirect(result.destinationUrl, 307)
}
