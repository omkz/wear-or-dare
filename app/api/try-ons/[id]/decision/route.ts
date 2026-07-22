import { NextRequest, NextResponse } from "next/server"

// Placeholder: Replace with Cloudflare D1 update
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { decision } = body

  if (!["wear", "dare"].includes(decision)) {
    return NextResponse.json({ success: false, error: "Invalid decision" }, { status: 400 })
  }

  return NextResponse.json({ success: true, tryOnId: id, decision })
}
