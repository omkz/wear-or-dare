import { NextRequest, NextResponse } from "next/server"
import { mockTryOns } from "@/lib/mock-data"
import type { TryOn } from "@/lib/types"

const resultImages = [
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=900&fit=crop",
]

// Placeholder: Replace with YouCam Apparel polling + Cloudflare D1 fetch
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Check mock data first
  const existing = mockTryOns.find((t) => t.id === id)
  if (existing) {
    return NextResponse.json({ success: true, tryOn: existing })
  }

  // Simulate a completed try-on for dynamic IDs
  const tryOn: TryOn = {
    id,
    sessionId: "session-001",
    challengeId: "ch-001",
    garmentId: "g-001",
    sourceImageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop",
    resultImageUrl: resultImages[Math.floor(Math.random() * resultImages.length)],
    status: "completed",
    decision: null,
    verdict: "Unexpectedly iconic.",
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json({ success: true, tryOn })
}
