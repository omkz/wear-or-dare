import { constants } from "node:fs"
import { open } from "node:fs/promises"
import path from "node:path"

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

const UPLOAD_DIRECTORY = path.resolve(process.cwd(), "storage", "uploads")
const SAFE_UPLOAD_FILENAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/

const FILE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const

export type AcceptedImageMimeType = keyof typeof FILE_EXTENSIONS

export function isAcceptedImageMimeType(value: string): value is AcceptedImageMimeType {
  return value in FILE_EXTENSIONS
}

export function getUploadExtension(mimeType: AcceptedImageMimeType) {
  return FILE_EXTENSIONS[mimeType]
}

export function getUploadDirectory() {
  return UPLOAD_DIRECTORY
}

export function isSafeUploadFilename(filename: string) {
  return SAFE_UPLOAD_FILENAME.test(filename) && path.basename(filename) === filename
}

export function resolveUploadPath(filename: string) {
  if (!isSafeUploadFilename(filename)) return null

  const resolvedPath = path.resolve(UPLOAD_DIRECTORY, filename)
  if (!resolvedPath.startsWith(`${UPLOAD_DIRECTORY}${path.sep}`)) return null

  return resolvedPath
}

export function getUploadImageUrl(filename: string) {
  return `/api/uploads/${filename}`
}

export function getUploadStoragePath(filename: string) {
  return `storage/uploads/${filename}`
}

export function getFilenameFromUploadUrl(imageUrl: string) {
  const prefix = "/api/uploads/"
  if (!imageUrl.startsWith(prefix)) return null

  const filename = imageUrl.slice(prefix.length)
  return isSafeUploadFilename(filename) ? filename : null
}

async function openUpload(filename: string) {
  const absolutePath = resolveUploadPath(filename)
  if (!absolutePath) return null

  try {
    const file = await open(absolutePath, constants.O_RDONLY | constants.O_NOFOLLOW)
    const stats = await file.stat()

    if (!stats.isFile()) {
      await file.close()
      return null
    }

    return file
  } catch {
    return null
  }
}

export async function uploadImageExists(imageUrl: string) {
  const filename = getFilenameFromUploadUrl(imageUrl)
  if (!filename) return false

  const file = await openUpload(filename)
  if (!file) return false

  await file.close()
  return true
}

export async function readUpload(filename: string) {
  const file = await openUpload(filename)
  if (!file) return null

  try {
    return await file.readFile()
  } finally {
    await file.close()
  }
}

export function hasValidImageSignature(
  bytes: Uint8Array,
  mimeType: AcceptedImageMimeType
) {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }

  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    return signature.every((value, index) => bytes[index] === value)
  }

  return (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
}

export function getUploadContentType(filename: string) {
  if (filename.endsWith(".jpg")) return "image/jpeg"
  if (filename.endsWith(".png")) return "image/png"
  if (filename.endsWith(".webp")) return "image/webp"
  return null
}
