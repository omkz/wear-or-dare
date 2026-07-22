import { NextRequest, NextResponse } from "next/server"
import { mockTryOns } from "@/lib/mock-data"
import type { ApiErrorResponse, GetTryOnResponse } from "@/lib/api-contracts"
import { refreshMockTryOn } from "@/lib/server/try-on-repository"

// Placeholder: Replace mock status progression with YouCam Apparel polling later.
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

  try {
    const tryOn = await refreshMockTryOn(id)
    if (!tryOn) {
      const response: ApiErrorResponse = {
        success: false,
        error: "Try-on not found",
      }
      return NextResponse.json(response, { status: 404 })
    }

    const response: GetTryOnResponse = { success: true, tryOn }
    return NextResponse.json(response)
  } catch {
    const response: ApiErrorResponse = {
      success: false,
      error: "Unable to load try-on",
    }
    return NextResponse.json(response, { status: 500 })
  }
}
