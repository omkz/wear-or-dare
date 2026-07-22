import { NextRequest, NextResponse } from "next/server"
import { mockTryOns } from "@/lib/mock-data"
import type { ApiErrorResponse, GetTryOnResponse } from "@/lib/api-contracts"
import { synchronizeYouCamTryOn } from "@/lib/server/try-on-service"
import {
  findTryOn,
  refreshMockTryOn,
} from "@/lib/server/try-on-repository"
import { YouCamApiError } from "@/lib/server/youcam-client"

function errorResponse(error: string, status: number) {
  const response: ApiErrorResponse = { success: false, error }
  return NextResponse.json(response, { status })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = mockTryOns.find((tryOn) => tryOn.id === id)
  if (existing) {
    const response: GetTryOnResponse = { success: true, tryOn: existing }
    return NextResponse.json(response)
  }

  try {
    const current = await findTryOn(id)
    if (!current) return errorResponse("Try-on not found", 404)

    const tryOn = current.provider === "youcam"
      ? await synchronizeYouCamTryOn(current)
      : await refreshMockTryOn(id)
    if (!tryOn) return errorResponse("Try-on not found", 404)

    const response: GetTryOnResponse = { success: true, tryOn }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof YouCamApiError) {
      const status = error.message === "YOUCAM_API_KEY is required" ? 503 : 502
      return errorResponse("The virtual try-on provider is temporarily unavailable", status)
    }
    return errorResponse("Unable to load try-on", 500)
  }
}
