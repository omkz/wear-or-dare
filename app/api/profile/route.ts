import { NextRequest, NextResponse } from "next/server"
import type { ApiErrorResponse, GetProfileResponse } from "@/lib/api-contracts"
import { auth } from "@/lib/server/auth"
import {
  getTryOnStatsByUserId,
  listRecentWearsByUserId,
} from "@/lib/server/try-on-repository"

const RECENT_WEARS_LIMIT = 3

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
    const [stats, recentWears] = await Promise.all([
      getTryOnStatsByUserId(session.user.id),
      listRecentWearsByUserId(session.user.id, RECENT_WEARS_LIMIT),
    ])

    const response: GetProfileResponse = { success: true, stats, recentWears }
    return NextResponse.json(response, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("[api/profile] Failed to load profile data", {
      userId: session.user.id,
      error,
    })
    return errorResponse("Unable to load profile data", 500)
  }
}
