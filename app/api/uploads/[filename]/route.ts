import { NextRequest, NextResponse } from "next/server"
import type { ApiErrorResponse } from "@/lib/api-contracts"
import {
  getUploadContentType,
  readUpload,
} from "@/lib/server/local-upload-storage"

export const runtime = "nodejs"

function notFoundResponse() {
  const response: ApiErrorResponse = { success: false, error: "Upload not found" }
  return NextResponse.json(response, { status: 404 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const contentType = getUploadContentType(filename)

  if (!contentType) return notFoundResponse()

  const file = await readUpload(filename)
  if (!file) return notFoundResponse()

  return new Response(file, {
    headers: {
      "Cache-Control": "private, no-cache",
      "Content-Length": String(file.byteLength),
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    },
  })
}
