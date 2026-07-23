import { NextRequest, NextResponse } from "next/server"
import type { ApiErrorResponse, UploadPhotoResponse } from "@/lib/api-contracts"
import {
  hasValidImageSignature,
  isAcceptedImageMimeType,
  MAX_UPLOAD_SIZE,
} from "@/lib/server/local-upload-storage"
import { localStorageService } from "@/lib/server/storage"

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

  let storedFile
  try {
    storedFile = await localStorageService.saveFile({
      bucket: "uploads",
      bytes,
      contentType: file.type,
      maxBytes: MAX_UPLOAD_SIZE,
    })
  } catch {
    return errorResponse("Upload failed. Please try again", 500)
  }

  const response: UploadPhotoResponse = {
    success: true,
    uploadId: storedFile.id,
    imageUrl: storedFile.publicUrl,
    storagePath: storedFile.storagePath,
  }

  return NextResponse.json(response, { status: 201 })
}
