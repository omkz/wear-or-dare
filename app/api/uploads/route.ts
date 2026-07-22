import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { NextRequest, NextResponse } from "next/server"
import type { ApiErrorResponse, UploadPhotoResponse } from "@/lib/api-contracts"
import {
  getUploadDirectory,
  getUploadExtension,
  getUploadImageUrl,
  getUploadStoragePath,
  hasValidImageSignature,
  isAcceptedImageMimeType,
  MAX_UPLOAD_SIZE,
  resolveUploadPath,
} from "@/lib/server/local-upload-storage"

export const runtime = "nodejs"

function errorResponse(error: string, status: number) {
  const response: ApiErrorResponse = { success: false, error }
  return NextResponse.json(response, { status })
}

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null)
  if (!formData) return errorResponse("Malformed upload request", 400)

  const file = formData.get("file")
  if (!(file instanceof File)) return errorResponse("An image file is required", 400)

  if (!isAcceptedImageMimeType(file.type)) {
    return errorResponse("Only JPEG, PNG, and WebP images are supported", 400)
  }

  if (file.size === 0) return errorResponse("The image file is empty", 400)
  if (file.size > MAX_UPLOAD_SIZE) {
    return errorResponse("Image must be 10 MB or smaller", 413)
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!hasValidImageSignature(bytes, file.type)) {
    return errorResponse("The file content does not match its image type", 400)
  }

  const uploadId = randomUUID()
  const filename = `${uploadId}.${getUploadExtension(file.type)}`
  const absolutePath = resolveUploadPath(filename)
  if (!absolutePath) return errorResponse("Unable to create a safe upload path", 500)

  try {
    await mkdir(getUploadDirectory(), { recursive: true })
    await writeFile(absolutePath, bytes, { flag: "wx" })
  } catch {
    return errorResponse("Upload failed. Please try again", 500)
  }

  const response: UploadPhotoResponse = {
    success: true,
    uploadId,
    imageUrl: getUploadImageUrl(filename),
    storagePath: getUploadStoragePath(filename),
  }

  return NextResponse.json(response, { status: 201 })
}
