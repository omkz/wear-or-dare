import { NextRequest, NextResponse } from "next/server"
import type {
  ApiErrorResponse,
  GetTryOnHistoryResponse,
} from "@/lib/api-contracts"
import { auth } from "@/lib/server/auth"
import { listTryOnsByUserId } from "@/lib/server/try-on-repository"

function errorResponse(error: string, status: number) {
  const response: ApiErrorResponse = { success: false, error }
  return NextResponse.json(response, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return errorResponse("Authentication required", 401)

  try {
    const tryOns = await listTryOnsByUserId(session.user.id)
    const response: GetTryOnHistoryResponse = { success: true, tryOns }
    return NextResponse.json(response, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("[api/try-ons/history] Failed to load try-on history", {
      userId: session.user.id,
      error,
    })
    return errorResponse("Unable to load try-on history", 500)
  }
}
