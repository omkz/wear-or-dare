import { NextRequest, NextResponse } from "next/server"
import type { ApiErrorResponse, GetTryOnResponse } from "@/lib/api-contracts"
import { auth } from "@/lib/server/auth"
import { synchronizeYouCamTryOn } from "@/lib/server/try-on-service"
import {
  findTryOn,
  refreshMockTryOn,
} from "@/lib/server/try-on-repository"
import { YouCamApiError } from "@/lib/server/youcam-client"
import { StorageError } from "@/lib/server/storage"

function errorResponse(error: string, status: number) {
  const response: ApiErrorResponse = { success: false, error }
  return NextResponse.json(response, { status })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return errorResponse("Authentication required", 401)

  try {
    const current = await findTryOn(id)
    if (!current || current.userId !== session.user.id) {
      return errorResponse("Try-on not found", 404)
    }

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
    if (error instanceof StorageError) {
      return errorResponse("The generated image could not be stored. Please try again", 502)
    }
    return errorResponse("Unable to load try-on", 500)
  }
}
