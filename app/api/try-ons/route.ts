import { NextRequest, NextResponse } from "next/server"
import type { ApiErrorResponse, CreateTryOnRequest, CreateTryOnResponse } from "@/lib/api-contracts"
import { auth } from "@/lib/server/auth"
import { getServerGarment } from "@/lib/server/garment-catalog"
import { readUploadById } from "@/lib/server/local-upload-storage"
import {
  createMockTryOn,
  isValidChallengeId,
} from "@/lib/server/mock-try-on-engine"
import { createYouCamProviderTask } from "@/lib/server/try-on-service"
import {
  getTryOnProvider,
} from "@/lib/server/try-on-provider"
import {
  claimTryOnRequest,
  findTryOnByRequestId,
  updateYouCamTryOnState,
} from "@/lib/server/try-on-repository"
import { getSafeTryOnCreateError } from "@/lib/server/try-on-error-response"
import type { TryOn } from "@/lib/types"

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

function isValidRequestId(requestId: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    requestId
  )
}

function matchesCreateRequest(tryOn: TryOn, requestBody: CreateTryOnRequest, userId: string) {
  return (
    tryOn.userId === userId &&
    tryOn.challengeId === requestBody.challengeId &&
    tryOn.sourceUploadId === requestBody.sourceUploadId
  )
}

function successResponse(tryOn: TryOn, status: 200 | 201) {
  const response: CreateTryOnResponse = { success: true, tryOn }
  return NextResponse.json(response, { status })
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return errorResponse("Authentication required", 401)

  const body: unknown = await request.json().catch(() => null)

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("Malformed request body", 400)
  }

  const { requestId, challengeId, sourceUploadId } = body as Record<string, unknown>
  if (typeof requestId !== "string" || !isValidRequestId(requestId)) {
    return errorResponse("Invalid request ID", 400)
  }
  if (typeof challengeId !== "string" || !isValidChallengeId(challengeId)) {
    return errorResponse("Invalid challenge ID", 400)
  }
  if (typeof sourceUploadId !== "string") {
    return errorResponse("Invalid source upload ID", 400)
  }

  const requestBody: CreateTryOnRequest = {
    requestId,
    challengeId,
    sourceUploadId,
  }

  try {
    const existing = await findTryOnByRequestId(requestId)
    if (existing) {
      if (!matchesCreateRequest(existing, requestBody, session.user.id)) {
        return errorResponse("Request ID is already in use", 409)
      }
      return successResponse(existing, 200)
    }
  } catch (error) {
    logCreateError("find-idempotent-request", error, { challengeId })
    return errorResponse("We couldn’t save the try-on. Please try again.", 500)
  }

  const sourceUpload = await readUploadById(sourceUploadId)
  if (!sourceUpload) return errorResponse("Uploaded source photo not found", 400)

  const baseTryOn = createMockTryOn(requestBody.requestId, requestBody.challengeId)
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

  if (provider === "youcam" && sourceUpload.contentType === "image/webp") {
    return errorResponse(
      "This provider supports JPEG or PNG photos only. Upload another photo and try again.",
      400
    )
  }

  const initialTryOn: TryOn = {
    ...baseTryOn,
    userId: session.user.id,
    sourceImageUrl: sourceUpload.imageUrl,
    sourceUploadId: sourceUpload.uploadId,
    status: "pending",
    provider,
    providerTaskId: null,
    resultImageUrl: "",
    resultStoragePath: null,
    providerResultUrl: null,
    errorMessage: null,
    startedAt: provider === "mock" ? baseTryOn.startedAt : null,
    completedAt: null,
  }

  let claimedTryOn: TryOn
  try {
    const claim = await claimTryOnRequest(requestId, initialTryOn)
    if (!matchesCreateRequest(claim.tryOn, requestBody, session.user.id)) {
      return errorResponse("Request ID is already in use", 409)
    }
    if (!claim.created) {
      return successResponse(claim.tryOn, 200)
    }
    claimedTryOn = claim.tryOn
  } catch (error) {
    logCreateError("save-database-record", error, {
      challengeId,
      garmentId: garment.id,
      provider,
    })
    return errorResponse("We couldn’t save the try-on. Please try again.", 500)
  }

  if (provider === "mock") {
    return successResponse(claimedTryOn, 201)
  }

  let providerTaskId: string
  try {
    providerTaskId = await createYouCamProviderTask(sourceUpload, garment)
  } catch (error) {
    logCreateError("create-provider-task", error, {
      challengeId,
      garmentId: garment.id,
      provider,
    })
    const safeError = getSafeTryOnCreateError(error)

    try {
      const failedTryOn = await updateYouCamTryOnState(claimedTryOn.id, {
        status: "failed",
        errorMessage: safeError.message,
        completedAt: new Date(),
      })
      if (!failedTryOn) {
        throw new Error("Claimed try-on disappeared before provider failure was saved")
      }
    } catch (databaseError) {
      logCreateError("save-provider-failure", databaseError, {
        challengeId,
        garmentId: garment.id,
        provider,
      })
      return errorResponse("We couldn’t save the try-on. Please try again.", 500)
    }

    return errorResponse(safeError.message, safeError.status)
  }

  try {
    const startedTryOn = await updateYouCamTryOnState(claimedTryOn.id, {
      status: "processing",
      providerTaskId,
      errorMessage: null,
      startedAt: new Date(),
      completedAt: null,
    })
    if (!startedTryOn) {
      throw new Error("Claimed try-on disappeared before provider task was saved")
    }
    return successResponse(startedTryOn, 201)
  } catch (error) {
    logCreateError("save-provider-task", error, {
      challengeId,
      garmentId: garment.id,
      provider,
    })
    return errorResponse("We couldn’t save the try-on. Please try again.", 500)
  }
}
