import { NextRequest, NextResponse } from "next/server"
import type { ApiErrorResponse, CreateTryOnRequest, CreateTryOnResponse } from "@/lib/api-contracts"
import { getServerGarment } from "@/lib/server/garment-catalog"
import { readUploadById } from "@/lib/server/local-upload-storage"
import {
  createMockTryOn,
  isValidChallengeId,
  isValidSessionId,
} from "@/lib/server/mock-try-on-engine"
import { createYouCamProviderTask } from "@/lib/server/try-on-service"
import {
  getTryOnProvider,
  TryOnProviderConfigurationError,
} from "@/lib/server/try-on-provider"
import { insertTryOn } from "@/lib/server/try-on-repository"
import { YouCamApiError } from "@/lib/server/youcam-client"

function errorResponse(error: string, status: number) {
  const response: ApiErrorResponse = { success: false, error }
  return NextResponse.json(response, { status })
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null)

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("Malformed request body", 400)
  }

  const { sessionId, challengeId, sourceUploadId } = body as Record<string, unknown>
  if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
    return errorResponse("Invalid session ID", 400)
  }
  if (typeof challengeId !== "string" || !isValidChallengeId(challengeId)) {
    return errorResponse("Invalid challenge ID", 400)
  }
  if (typeof sourceUploadId !== "string") {
    return errorResponse("Invalid source upload ID", 400)
  }

  const sourceUpload = await readUploadById(sourceUploadId)
  if (!sourceUpload) return errorResponse("Uploaded source photo not found", 400)

  const requestBody: CreateTryOnRequest = { sessionId, challengeId, sourceUploadId }
  const baseTryOn = createMockTryOn(requestBody.sessionId, requestBody.challengeId)
  if (!baseTryOn) return errorResponse("Unable to create try-on", 400)

  const garment = getServerGarment(baseTryOn.garmentId)
  if (!garment) return errorResponse("Selected garment is unavailable", 400)

  let provider
  try {
    provider = getTryOnProvider()
  } catch (error) {
    if (error instanceof TryOnProviderConfigurationError) {
      return errorResponse("Try-on provider is not configured", 500)
    }
    return errorResponse("Unable to configure try-on provider", 500)
  }

  let providerTaskId: string | null = null
  if (provider === "youcam") {
    if (sourceUpload.contentType === "image/webp") {
      return errorResponse("YouCam requires a JPEG or PNG source photo", 400)
    }

    try {
      providerTaskId = await createYouCamProviderTask(sourceUpload, garment)
    } catch (error) {
      if (error instanceof YouCamApiError && error.message === "YOUCAM_API_KEY is required") {
        return errorResponse("Try-on provider is not configured", 503)
      }
      return errorResponse("The virtual try-on provider could not start this request", 502)
    }
  }

  const tryOn = {
    ...baseTryOn,
    sourceImageUrl: sourceUpload.imageUrl,
    sourceUploadId: sourceUpload.uploadId,
    status: provider === "youcam" ? "processing" as const : baseTryOn.status,
    provider,
    providerTaskId,
    resultImageUrl: "",
    resultStoragePath: null,
    providerResultUrl: null,
    errorMessage: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
  }

  try {
    await insertTryOn(tryOn)
  } catch {
    return errorResponse("Unable to save try-on", 500)
  }

  const response: CreateTryOnResponse = { success: true, tryOn }
  return NextResponse.json(response, { status: 201 })
}
