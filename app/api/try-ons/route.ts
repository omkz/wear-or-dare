import { NextRequest, NextResponse } from "next/server"
import type { ApiErrorResponse, CreateTryOnRequest, CreateTryOnResponse } from "@/lib/api-contracts"
import {
  createMockTryOn,
  isValidChallengeId,
  isValidSessionId,
} from "@/lib/server/mock-try-on-engine"

// Placeholder: Replace with YouCam Apparel Virtual Try-On API + Cloudflare D1
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null)

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const response: ApiErrorResponse = { success: false, error: "Malformed request body" }
    return NextResponse.json(response, { status: 400 })
  }

  const { sessionId, challengeId } = body as Record<string, unknown>
  if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
    const response: ApiErrorResponse = { success: false, error: "Invalid session ID" }
    return NextResponse.json(response, { status: 400 })
  }

  if (typeof challengeId !== "string" || !isValidChallengeId(challengeId)) {
    const response: ApiErrorResponse = { success: false, error: "Invalid challenge ID" }
    return NextResponse.json(response, { status: 400 })
  }

  const requestBody: CreateTryOnRequest = { sessionId, challengeId }
  const tryOn = createMockTryOn(requestBody.sessionId, requestBody.challengeId)
  if (!tryOn) {
    const response: ApiErrorResponse = { success: false, error: "Unable to create try-on" }
    return NextResponse.json(response, { status: 400 })
  }

  const response: CreateTryOnResponse = { success: true, tryOn }
  return NextResponse.json(response, { status: 201 })
}
