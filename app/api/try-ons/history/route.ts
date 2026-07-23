import { NextRequest, NextResponse } from "next/server"
import type {
  ApiErrorResponse,
  GetTryOnHistoryResponse,
} from "@/lib/api-contracts"
import { isValidSessionId } from "@/lib/server/mock-try-on-engine"
import { listTryOnsBySessionId } from "@/lib/server/try-on-repository"

function errorResponse(error: string, status: number) {
  const response: ApiErrorResponse = { success: false, error }
  return NextResponse.json(response, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId")
  if (!sessionId || !isValidSessionId(sessionId)) {
    return errorResponse("Invalid session ID", 400)
  }

  try {
    const tryOns = await listTryOnsBySessionId(sessionId)
    const response: GetTryOnHistoryResponse = { success: true, tryOns }
    return NextResponse.json(response, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("[api/try-ons/history] Failed to load try-on history", {
      sessionId,
      error,
    })
    return errorResponse("Unable to load try-on history", 500)
  }
}
