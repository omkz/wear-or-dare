import { NextRequest, NextResponse } from "next/server"

// Placeholder: Replace with Cloudflare D1 vote tally
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { choice } = body

  if (!["A", "B"].includes(choice)) {
    return NextResponse.json({ success: false, error: "Invalid choice" }, { status: 400 })
  }

  const baseA = 1247
  const baseB = 893
  const totalA = choice === "A" ? baseA + 1 : baseA
  const totalB = choice === "B" ? baseB + 1 : baseB
  const total = totalA + totalB

  return NextResponse.json({
    success: true,
    battleId: id,
    choice,
    results: {
      outfitAVotes: totalA,
      outfitBVotes: totalB,
      outfitAPercent: Math.round((totalA / total) * 100),
      outfitBPercent: Math.round((totalB / total) * 100),
    },
  })
}
