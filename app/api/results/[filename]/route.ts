import { NextRequest, NextResponse } from "next/server"
import type { ApiErrorResponse } from "@/lib/api-contracts"
import { localStorageService } from "@/lib/server/storage"

export const runtime = "nodejs"

function notFoundResponse() {
  const response: ApiErrorResponse = { success: false, error: "Result image not found" }
  return NextResponse.json(response, { status: 404 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const file = await localStorageService.readFile("results", filename)
  if (!file) return notFoundResponse()

  return new Response(file.bytes, {
    headers: {
      "Cache-Control": "private, no-cache",
      "Content-Length": String(file.size),
      "Content-Type": file.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  })
}
