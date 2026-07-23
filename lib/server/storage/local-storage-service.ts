import "server-only"
import { randomUUID } from "node:crypto"
import { lookup } from "node:dns/promises"
import { constants } from "node:fs"
import { mkdir, open, unlink, writeFile } from "node:fs/promises"
import { isIP } from "node:net"
import path from "node:path"
import {
  detectImageContentType,
  IMAGE_FILE_EXTENSIONS,
  isImageContentType,
  StorageError,
  type ImageContentType,
  type ReadStoredFile,
  type SaveFileInput,
  type SaveRemoteImageInput,
  type StorageBucket,
  type StorageService,
  type StoredFile,
} from "@/lib/server/storage/storage-service"

const UPLOAD_DIRECTORY = path.resolve(process.cwd(), "storage", "uploads")
const RESULT_DIRECTORY = path.resolve(process.cwd(), "storage", "results")
const SAFE_FILE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const SAFE_FILENAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/
const MAX_REDIRECTS = 3

function getContentType(filename: string): ImageContentType | null {
  if (filename.endsWith(".jpg")) return "image/jpeg"
  if (filename.endsWith(".png")) return "image/png"
  if (filename.endsWith(".webp")) return "image/webp"
  return null
}

function getBucketDirectory(bucket: StorageBucket) {
  return bucket === "uploads" ? UPLOAD_DIRECTORY : RESULT_DIRECTORY
}

function resolveStoragePath(bucket: StorageBucket, filename: string) {
  if (!SAFE_FILENAME.test(filename) || path.basename(filename) !== filename) return null

  const directory = getBucketDirectory(bucket)
  const resolved =
    bucket === "uploads"
      ? path.resolve(UPLOAD_DIRECTORY, filename)
      : path.resolve(RESULT_DIRECTORY, filename)
  return resolved.startsWith(`${directory}${path.sep}`) ? resolved : null
}

function isBlockedIpv4(address: string) {
  const octets = address.split(".").map(Number)
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) return true

  const [first, second, third] = octets
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113)
  )
}

function isBlockedIpAddress(address: string) {
  const version = isIP(address)
  if (version === 4) return isBlockedIpv4(address)
  if (version !== 6) return true

  const normalized = address.toLowerCase()
  const mappedIpv4 = normalized.match(/(?:^|:)ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1]
  if (mappedIpv4) return isBlockedIpv4(mappedIpv4)

  const firstGroup = Number.parseInt(normalized.split(":")[0] || "0", 16)
  return (
    normalized === "::" ||
    normalized === "::1" ||
    firstGroup < 0x2000 ||
    firstGroup > 0x3fff ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:") ||
    normalized.startsWith("2001:0:") ||
    normalized.startsWith("2002:")
  )
}

async function validateRemoteUrl(value: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new StorageError("The remote image URL is invalid")
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  ) {
    throw new StorageError("Only public HTTPS image URLs are supported")
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new StorageError("Private image hosts are not supported")
  }

  if (isIP(hostname)) {
    if (isBlockedIpAddress(hostname)) {
      throw new StorageError("Private image hosts are not supported")
    }
    return url
  }

  let addresses
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true })
  } catch {
    throw new StorageError("The remote image host could not be resolved")
  }

  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedIpAddress(address))) {
    throw new StorageError("Private image hosts are not supported")
  }

  return url
}

async function readResponseBody(response: Response, maxBytes: number) {
  if (!response.body) throw new StorageError("The remote image response was empty")

  const declaredLength = Number(response.headers.get("content-length"))
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new StorageError("The remote image exceeds the storage size limit")
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw new StorageError("The remote image exceeds the storage size limit")
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

async function fetchRemoteImage(value: string, maxBytes: number) {
  let url = await validateRemoteUrl(value)

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (!location || redirectCount === MAX_REDIRECTS) {
        throw new StorageError("The remote image redirected too many times")
      }
      await response.body?.cancel()
      url = await validateRemoteUrl(new URL(location, url).toString())
      continue
    }

    if (!response.ok) {
      throw new StorageError("The remote image could not be downloaded")
    }

    const declaredType = response.headers.get("content-type")?.split(";")[0]?.trim()
    const normalizedType = declaredType === "image/jpg" ? "image/jpeg" : declaredType
    if (
      normalizedType &&
      normalizedType !== "application/octet-stream" &&
      !isImageContentType(normalizedType)
    ) {
      throw new StorageError("The remote file is not a supported image")
    }

    const bytes = await readResponseBody(response, maxBytes)
    const detectedType = detectImageContentType(bytes)
    if (!detectedType || (isImageContentType(normalizedType ?? "") && detectedType !== normalizedType)) {
      throw new StorageError("The remote file content is not a valid supported image")
    }

    return { bytes, contentType: detectedType }
  }

  throw new StorageError("The remote image could not be downloaded")
}

export class LocalStorageService implements StorageService {
  async saveFile(input: SaveFileInput): Promise<StoredFile> {
    if (input.bytes.byteLength === 0 || input.bytes.byteLength > input.maxBytes) {
      throw new StorageError("The image size is outside the allowed range")
    }

    if (detectImageContentType(input.bytes) !== input.contentType) {
      throw new StorageError("The file content does not match its image type")
    }

    const id = randomUUID()
    const filename = `${id}.${IMAGE_FILE_EXTENSIONS[input.contentType]}`
    const absolutePath = resolveStoragePath(input.bucket, filename)
    if (!absolutePath) throw new StorageError("Unable to create a safe storage path")

    try {
      await mkdir(/*turbopackIgnore: true*/ getBucketDirectory(input.bucket), {
        recursive: true,
      })
      await writeFile(/*turbopackIgnore: true*/ absolutePath, input.bytes, {
        flag: "wx",
      })
    } catch {
      throw new StorageError("The image could not be written to local storage")
    }

    return {
      id,
      filename,
      contentType: input.contentType,
      size: input.bytes.byteLength,
      storagePath: `storage/${input.bucket}/${filename}`,
      publicUrl: this.getPublicUrl(input.bucket, filename),
    }
  }

  async saveRemoteImage(input: SaveRemoteImageInput): Promise<StoredFile> {
    try {
      const image = await fetchRemoteImage(input.url, input.maxBytes)
      return this.saveFile({
        bucket: input.bucket,
        bytes: image.bytes,
        contentType: image.contentType,
        maxBytes: input.maxBytes,
      })
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw new StorageError("The remote image could not be downloaded")
    }
  }

  getPublicUrl(bucket: StorageBucket, filename: string) {
    if (!resolveStoragePath(bucket, filename)) {
      throw new StorageError("Invalid storage filename")
    }
    return `/api/${bucket}/${filename}`
  }

  async deleteFile(bucket: StorageBucket, filename: string) {
    const absolutePath = resolveStoragePath(bucket, filename)
    if (!absolutePath) return false

    try {
      await unlink(/*turbopackIgnore: true*/ absolutePath)
      return true
    } catch {
      return false
    }
  }

  async readFile(bucket: StorageBucket, filename: string): Promise<ReadStoredFile | null> {
    const absolutePath = resolveStoragePath(bucket, filename)
    const contentType = getContentType(filename)
    if (!absolutePath || !contentType) return null

    let file
    try {
      file = await open(
        /*turbopackIgnore: true*/ absolutePath,
        constants.O_RDONLY | constants.O_NOFOLLOW
      )
      const stats = await file.stat()
      if (!stats.isFile()) {
        return null
      }

      const bytes = new Uint8Array(await file.readFile())
      if (detectImageContentType(bytes) !== contentType) return null
      const id = filename.slice(0, filename.lastIndexOf("."))
      return {
        id,
        filename,
        contentType,
        size: bytes.byteLength,
        storagePath: `storage/${bucket}/${filename}`,
        publicUrl: this.getPublicUrl(bucket, filename),
        bytes,
      }
    } catch {
      return null
    } finally {
      await file?.close()
    }
  }

  async findFileById(bucket: StorageBucket, id: string) {
    if (!SAFE_FILE_ID.test(id)) return null

    const matches = await Promise.all(
      Object.values(IMAGE_FILE_EXTENSIONS).map((extension) =>
        this.readFile(bucket, `${id}.${extension}`)
      )
    )
    const files = matches.filter((file): file is ReadStoredFile => file !== null)
    return files.length === 1 ? files[0] : null
  }
}

export const localStorageService = new LocalStorageService()
