import { NextRequest, NextResponse } from "next/server"
import type {
  ApiErrorResponse,
  UpdateTryOnDecisionRequest,
  UpdateTryOnDecisionResponse,
} from "@/lib/api-contracts"
import { mockTryOns } from "@/lib/mock-data"
import { reconstructMockTryOn } from "@/lib/server/mock-try-on-engine"

// Placeholder: Replace with Cloudflare D1 update
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tryOn = mockTryOns.find((item) => item.id === id) ?? reconstructMockTryOn(id)
  if (!tryOn) {
    const response: ApiErrorResponse = { success: false, error: "Try-on not found" }
    return NextResponse.json(response, { status: 404 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const response: ApiErrorResponse = { success: false, error: "Malformed request body" }
    return NextResponse.json(response, { status: 400 })
  }

  const { decision } = body as Record<string, unknown>

  if (decision !== "wear" && decision !== "dare") {
    const response: ApiErrorResponse = { success: false, error: "Invalid decision" }
    return NextResponse.json(response, { status: 400 })
  }

  const requestBody: UpdateTryOnDecisionRequest = { decision }
  const response: UpdateTryOnDecisionResponse = {
    success: true,
    tryOnId: tryOn.id,
    decision: requestBody.decision,
  }
  return NextResponse.json(response)
}
