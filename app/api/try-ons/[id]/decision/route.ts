import { NextRequest, NextResponse } from "next/server"
import type {
  ApiErrorResponse,
  UpdateTryOnDecisionRequest,
  UpdateTryOnDecisionResponse,
} from "@/lib/api-contracts"
import { updateTryOnDecision } from "@/lib/server/try-on-repository"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
  try {
    const tryOn = await updateTryOnDecision(id, requestBody.decision)
    if (!tryOn) {
      const response: ApiErrorResponse = { success: false, error: "Try-on not found" }
      return NextResponse.json(response, { status: 404 })
    }

    const response: UpdateTryOnDecisionResponse = {
      success: true,
      tryOnId: tryOn.id,
      decision: tryOn.decision ?? requestBody.decision,
    }
    return NextResponse.json(response)
  } catch {
    const response: ApiErrorResponse = {
      success: false,
      error: "Unable to save decision",
    }
    return NextResponse.json(response, { status: 500 })
  }
}
