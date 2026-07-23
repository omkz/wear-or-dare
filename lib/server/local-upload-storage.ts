import "server-only"
import {
  detectImageContentType,
  isImageContentType,
  type ImageContentType,
} from "@/lib/server/storage/storage-service"
import { localStorageService } from "@/lib/server/storage"

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

export type AcceptedImageMimeType = ImageContentType

export interface StoredUpload {
  uploadId: string
  filename: string
  contentType: AcceptedImageMimeType
  imageUrl: string
  bytes: Uint8Array
}

export function isAcceptedImageMimeType(value: string): value is AcceptedImageMimeType {
  return isImageContentType(value)
}

export async function readUploadById(uploadId: string) {
  const file = await localStorageService.findFileById("uploads", uploadId)
  if (!file) return null

  return {
    uploadId: file.id,
    filename: file.filename,
    contentType: file.contentType,
    imageUrl: file.publicUrl,
    bytes: file.bytes,
  } satisfies StoredUpload
}

export function hasValidImageSignature(
  bytes: Uint8Array,
  mimeType: AcceptedImageMimeType
) {
  return detectImageContentType(bytes) === mimeType
}
