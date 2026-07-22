import { NextRequest, NextResponse } from "next/server"
import { mockTryOns } from "@/lib/mock-data"
import type { ApiErrorResponse, GetTryOnResponse } from "@/lib/api-contracts"
import { reconstructMockTryOn } from "@/lib/server/mock-try-on-engine"

// Placeholder: Replace with YouCam Apparel polling + Cloudflare D1 fetch
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = mockTryOns.find((t) => t.id === id)
  if (existing) {
    const response: GetTryOnResponse = { success: true, tryOn: existing }
    return NextResponse.json(response)
  }

  const tryOn = reconstructMockTryOn(id)
  if (!tryOn) {
    const response: ApiErrorResponse = {
      success: false,
      error: "Try-on not found",
    }
    return NextResponse.json(response, { status: 404 })
  }

  const response: GetTryOnResponse = { success: true, tryOn }
  return NextResponse.json(response)
}
