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
} from "@/lib/server/try-on-provider"
import { insertTryOn } from "@/lib/server/try-on-repository"
import { getSafeTryOnCreateError } from "@/lib/server/try-on-error-response"

function errorResponse(error: string, status: number) {
  const response: ApiErrorResponse = { success: false, error }
  return NextResponse.json(response, { status })
}

function logCreateError(
  stage: string,
  error: unknown,
  context: {
    challengeId?: string
    garmentId?: string
    provider?: string
  } = {}
) {
  console.error("[api/try-ons] Failed to create try-on", {
    stage,
    ...context,
    error,
  })
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
  if (!garment) {
    logCreateError("resolve-garment", new Error("Garment configuration not found"), {
      challengeId,
      garmentId: baseTryOn.garmentId,
    })
    return errorResponse(
      "The selected garment image is unavailable. Choose another look and try again.",
      422
    )
  }

  let provider
  try {
    provider = getTryOnProvider()
  } catch (error) {
    logCreateError("configure-provider", error, {
      challengeId,
      garmentId: garment.id,
    })
    const safeError = getSafeTryOnCreateError(error)
    return errorResponse(safeError.message, safeError.status)
  }

  let providerTaskId: string | null = null
  if (provider === "youcam") {
    if (sourceUpload.contentType === "image/webp") {
      return errorResponse(
        "This provider supports JPEG or PNG photos only. Upload another photo and try again.",
        400
      )
    }

    try {
      providerTaskId = await createYouCamProviderTask(sourceUpload, garment)
    } catch (error) {
      logCreateError("create-provider-task", error, {
        challengeId,
        garmentId: garment.id,
        provider,
      })
      const safeError = getSafeTryOnCreateError(error)
      return errorResponse(safeError.message, safeError.status)
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
  } catch (error) {
    logCreateError("save-database-record", error, {
      challengeId,
      garmentId: garment.id,
      provider,
    })
    return errorResponse("We couldn’t save the try-on. Please try again.", 500)
  }

  const response: CreateTryOnResponse = { success: true, tryOn }
  return NextResponse.json(response, { status: 201 })
}
