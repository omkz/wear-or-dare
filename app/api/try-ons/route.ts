import { NextRequest, NextResponse } from "next/server"
import type { TryOn } from "@/lib/types"
import { verdicts, mockChallenges, mockGarments } from "@/lib/mock-data"

// Placeholder: Replace with YouCam Apparel Virtual Try-On API + Cloudflare D1
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, challengeId, garmentId, sourceImageUrl } = body

    const garment = mockGarments.find((g) => g.id === garmentId) ?? mockGarments[0]
    const challenge = mockChallenges.find((c) => c.id === challengeId) ?? mockChallenges[0]

    const tryOn: TryOn = {
      id: `tryon-${Date.now()}`,
      sessionId: sessionId ?? "session-001",
      challengeId: challenge.id,
      garmentId: garment.id,
      sourceImageUrl: sourceImageUrl ?? "",
      resultImageUrl: "",
      status: "pending",
      decision: null,
      verdict: verdicts[Math.floor(Math.random() * verdicts.length)],
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, tryOn })
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create try-on" }, { status: 500 })
  }
}
