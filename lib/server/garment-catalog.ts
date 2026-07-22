import "server-only"
import { constants } from "node:fs"
import { open } from "node:fs/promises"
import path from "node:path"
import { mockGarments } from "@/lib/mock-data"
import type { Garment } from "@/lib/types"
import type {
  YouCamGarmentCategory,
  YouCamImageContentType,
} from "@/lib/server/youcam-client"

const MAX_YOUCAM_IMAGE_SIZE = 10 * 1024 * 1024
const REMOTE_IMAGE_TIMEOUT_MS = 30_000
const MAX_REDIRECTS = 3
const PUBLIC_DIRECTORY = path.resolve(process.cwd(), "public")

export type GarmentImageLocation =
  | { type: "local"; path: string }
  | { type: "remote"; url: string }

export interface ServerGarment {
  id: string
  display: Garment
  imageLocation: GarmentImageLocation
  youCamCategory: YouCamGarmentCategory
}

export interface LoadedGarmentImage {
  bytes: Uint8Array
  contentType: YouCamImageContentType
  fileName: string
}

interface GarmentProviderConfiguration {
  imageLocation: GarmentImageLocation
  youCamCategory: YouCamGarmentCategory
}

const garmentProviderConfiguration: Record<string, GarmentProviderConfiguration> = {
  "g-001": {
    imageLocation: {
      type: "remote",
      url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&fit=crop",
    },
    youCamCategory: "upper_body",
  },
  "g-002": {
    imageLocation: {
      type: "remote",
      url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&fit=crop",
    },
    youCamCategory: "lower_body",
  },
  "g-003": {
    imageLocation: {
      type: "remote",
      url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&fit=crop",
    },
    youCamCategory: "full_body",
  },
  "g-004": {
    imageLocation: {
      type: "remote",
      url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&fit=crop",
    },
    youCamCategory: "upper_body",
  },
  "g-005": {
    imageLocation: {
      type: "remote",
      url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&fit=crop",
    },
    youCamCategory: "full_body",
  },
  "g-006": {
    imageLocation: {
      type: "remote",
      url: "https://images.unsplash.com/photo-1703863128779-842936251b15?w=1200&fit=crop",
    },
    youCamCategory: "lower_body",
  },
}

export class GarmentImageError extends Error {
  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message, options)
    this.name = "GarmentImageError"
  }
}

function requireHttpsUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") throw new Error("Expected HTTPS")
    return url
  } catch (cause) {
    throw new GarmentImageError("Garment image URL must use HTTPS", { cause })
  }
}

function detectContentType(bytes: Uint8Array): YouCamImageContentType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpg"
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (pngSignature.every((value, index) => bytes[index] === value)) return "image/png"

  return null
}

function buildLoadedImage(garmentId: string, bytes: Uint8Array): LoadedGarmentImage {
  if (bytes.byteLength === 0 || bytes.byteLength >= MAX_YOUCAM_IMAGE_SIZE) {
    throw new GarmentImageError("Garment image must be non-empty and under 10 MB")
  }

  const contentType = detectContentType(bytes)
  if (!contentType) throw new GarmentImageError("Garment image must be JPG or PNG")

  return {
    bytes,
    contentType,
    fileName: `garment-${garmentId}.${contentType === "image/png" ? "png" : "jpg"}`,
  }
}

async function loadLocalImage(garmentId: string, relativePath: string) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new GarmentImageError("Invalid packaged garment image path")
  }

  const absolutePath = path.resolve(PUBLIC_DIRECTORY, relativePath)
  if (!absolutePath.startsWith(`${PUBLIC_DIRECTORY}${path.sep}`)) {
    throw new GarmentImageError("Packaged garment image path escapes the public directory")
  }

  try {
    const file = await open(absolutePath, constants.O_RDONLY | constants.O_NOFOLLOW)
    try {
      const stats = await file.stat()
      if (!stats.isFile() || stats.size <= 0 || stats.size >= MAX_YOUCAM_IMAGE_SIZE) {
        throw new GarmentImageError("Packaged garment image is invalid or too large")
      }
      return buildLoadedImage(garmentId, new Uint8Array(await file.readFile()))
    } finally {
      await file.close()
    }
  } catch (cause) {
    if (cause instanceof GarmentImageError) throw cause
    throw new GarmentImageError("Packaged garment image could not be read", { cause })
  }
}

async function readRemoteBody(response: Response) {
  const contentLength = Number(response.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength >= MAX_YOUCAM_IMAGE_SIZE) {
    throw new GarmentImageError("Remote garment image is too large")
  }
  if (!response.body) throw new GarmentImageError("Remote garment image has no body")

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes >= MAX_YOUCAM_IMAGE_SIZE) {
      await reader.cancel()
      throw new GarmentImageError("Remote garment image is too large")
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

async function loadRemoteImage(garmentId: string, rawUrl: string) {
  let url = requireHttpsUrl(rawUrl)

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REMOTE_IMAGE_TIMEOUT_MS)

    try {
      const response = await fetch(url, { redirect: "manual", signal: controller.signal })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location")
        if (!location || redirectCount === MAX_REDIRECTS) {
          throw new GarmentImageError("Remote garment image redirected too many times")
        }
        url = requireHttpsUrl(new URL(location, url).toString())
        continue
      }

      if (!response.ok) {
        throw new GarmentImageError(
          `Remote garment image returned HTTP ${response.status}`
        )
      }

      return buildLoadedImage(garmentId, await readRemoteBody(response))
    } catch (cause) {
      if (cause instanceof GarmentImageError) throw cause
      const message = controller.signal.aborted
        ? "Remote garment image request timed out"
        : "Remote garment image request failed"
      throw new GarmentImageError(message, { cause })
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new GarmentImageError("Remote garment image could not be loaded")
}

export function getServerGarment(garmentId: string) {
  const display = mockGarments.find((garment) => garment.id === garmentId)
  const providerConfiguration = garmentProviderConfiguration[garmentId]
  if (!display || !providerConfiguration) return null

  const garment: ServerGarment = {
    id: garmentId,
    display,
    ...providerConfiguration,
  }
  return garment
}

export async function loadGarmentImage(garment: ServerGarment) {
  return garment.imageLocation.type === "local"
    ? loadLocalImage(garment.id, garment.imageLocation.path)
    : loadRemoteImage(garment.id, garment.imageLocation.url)
}
