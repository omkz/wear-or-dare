import { NextRequest, NextResponse } from "next/server"
import type { ApiErrorResponse, CreateTryOnRequest, CreateTryOnResponse } from "@/lib/api-contracts"
import {
  createMockTryOn,
  isValidChallengeId,
  isValidSessionId,
} from "@/lib/server/mock-try-on-engine"
import { uploadImageExists } from "@/lib/server/local-upload-storage"
import { insertTryOn } from "@/lib/server/try-on-repository"

// Placeholder: Replace the mock generation engine with YouCam Apparel later.
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null)

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const response: ApiErrorResponse = { success: false, error: "Malformed request body" }
    return NextResponse.json(response, { status: 400 })
  }

  const { sessionId, challengeId, sourceImageUrl } = body as Record<string, unknown>
  if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
    const response: ApiErrorResponse = { success: false, error: "Invalid session ID" }
    return NextResponse.json(response, { status: 400 })
  }

  if (typeof challengeId !== "string" || !isValidChallengeId(challengeId)) {
    const response: ApiErrorResponse = { success: false, error: "Invalid challenge ID" }
    return NextResponse.json(response, { status: 400 })
  }

  if (
    typeof sourceImageUrl !== "string" ||
    !(await uploadImageExists(sourceImageUrl))
  ) {
    const response: ApiErrorResponse = { success: false, error: "Invalid source image URL" }
    return NextResponse.json(response, { status: 400 })
  }

  const requestBody: CreateTryOnRequest = { sessionId, challengeId, sourceImageUrl }
  const mockTryOn = createMockTryOn(requestBody.sessionId, requestBody.challengeId)
  if (!mockTryOn) {
    const response: ApiErrorResponse = { success: false, error: "Unable to create try-on" }
    return NextResponse.json(response, { status: 400 })
  }

  const tryOn = { ...mockTryOn, sourceImageUrl: requestBody.sourceImageUrl }

  try {
    await insertTryOn(tryOn)
  } catch {
    const response: ApiErrorResponse = {
      success: false,
      error: "Unable to save try-on",
    }
    return NextResponse.json(response, { status: 500 })
  }

  const response: CreateTryOnResponse = { success: true, tryOn }
  return NextResponse.json(response, { status: 201 })
}
