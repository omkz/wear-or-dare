import "server-only"

export const IMAGE_FILE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const

export type ImageContentType = keyof typeof IMAGE_FILE_EXTENSIONS
export type StorageBucket = "uploads" | "results"

export interface StoredFile {
  id: string
  filename: string
  contentType: ImageContentType
  size: number
  storagePath: string
  publicUrl: string
}

export interface ReadStoredFile extends StoredFile {
  bytes: Uint8Array
}

export interface SaveFileInput {
  bucket: StorageBucket
  bytes: Uint8Array
  contentType: ImageContentType
  maxBytes: number
}

export interface SaveRemoteImageInput {
  bucket: StorageBucket
  url: string
  maxBytes: number
}

export interface StorageService {
  saveFile(input: SaveFileInput): Promise<StoredFile>
  saveRemoteImage(input: SaveRemoteImageInput): Promise<StoredFile>
  getPublicUrl(bucket: StorageBucket, filename: string): string
  deleteFile(bucket: StorageBucket, filename: string): Promise<boolean>
  readFile(bucket: StorageBucket, filename: string): Promise<ReadStoredFile | null>
  findFileById(bucket: StorageBucket, id: string): Promise<ReadStoredFile | null>
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StorageError"
  }
}

export function isImageContentType(value: string): value is ImageContentType {
  return Object.prototype.hasOwnProperty.call(IMAGE_FILE_EXTENSIONS, value)
}

export function detectImageContentType(bytes: Uint8Array): ImageContentType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg"
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (
    bytes.length >= pngSignature.length &&
    pngSignature.every((value, index) => bytes[index] === value)
  ) {
    return "image/png"
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp"
  }

  return null
}
