import { NextResponse } from "next/server"
import { mockBattle } from "@/lib/mock-data"

// Placeholder: Replace with Cloudflare D1
export async function POST() {
  return NextResponse.json({ success: true, battle: mockBattle })
}
