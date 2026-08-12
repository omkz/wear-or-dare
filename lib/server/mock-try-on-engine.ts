import { randomUUID } from "node:crypto"
import {
  mockChallenges,
  mockGarmentIdByChallenge,
  mockGarments,
  verdicts,
} from "@/lib/mock-data"
import type { TryOn, TryOnStatus } from "@/lib/types"

const TOKEN_PREFIX = "tryon-v1."
const PENDING_DURATION_MS = 1_500
const PROCESSING_DURATION_MS = 4_000
const MIN_CREATED_AT = Date.UTC(2020, 0, 1)

const resultImages = [
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=900&fit=crop",
] as const

interface TryOnTokenPayload {
  v: 1
  s: string
  c: string
  g: string
  t: number
  r: number
  w: number
  n: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hashSeed(value: string) {
  let hash = 2_166_136_261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return hash >>> 0
}

function getStatus(createdAt: number, now: number): TryOnStatus {
  const elapsed = Math.max(0, now - createdAt)
  if (elapsed < PENDING_DURATION_MS) return "pending"
  if (elapsed < PROCESSING_DURATION_MS) return "processing"
  return "completed"
}

function encodePayload(payload: TryOnTokenPayload) {
  return `${TOKEN_PREFIX}${Buffer.from(JSON.stringify(payload)).toString("base64url")}`
}

function parsePayload(id: string, now: number): TryOnTokenPayload | null {
  if (!id.startsWith(TOKEN_PREFIX) || id.length > 768) return null

  const encoded = id.slice(TOKEN_PREFIX.length)
  if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null

  try {
    const value: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"))
    if (!isRecord(value)) return null

    if (
      value.v !== 1 ||
      typeof value.s !== "string" ||
      typeof value.c !== "string" ||
      typeof value.g !== "string" ||
      typeof value.t !== "number" ||
      typeof value.r !== "number" ||
      typeof value.w !== "number" ||
      typeof value.n !== "string"
    ) {
      return null
    }

    const payload: TryOnTokenPayload = {
      v: 1,
      s: value.s,
      c: value.c,
      g: value.g,
      t: value.t,
      r: value.r,
      w: value.w,
      n: value.n,
    }

    const challengeExists = mockChallenges.some((challenge) => challenge.id === payload.c)
    const garmentExists = mockGarments.some((garment) => garment.id === payload.g)
    const expectedGarment = mockGarmentIdByChallenge[payload.c]

    if (
      payload.v !== 1 ||
      !isValidSessionId(payload.s) ||
      !challengeExists ||
      !garmentExists ||
      payload.g !== expectedGarment ||
      !Number.isInteger(payload.t) ||
      payload.t < MIN_CREATED_AT ||
      payload.t > now + 60_000 ||
      !Number.isInteger(payload.r) ||
      payload.r < 0 ||
      payload.r >= resultImages.length ||
      !Number.isInteger(payload.w) ||
      payload.w < 0 ||
      payload.w >= verdicts.length ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(payload.n)
    ) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

function buildTryOn(id: string, payload: TryOnTokenPayload, now: number): TryOn {
  const status = getStatus(payload.t, now)
  const createdAt = new Date(payload.t).toISOString()

  return {
    id,
    sessionId: payload.s,
    // Reconstructed from the opaque mock token, which doesn't encode the
    // owner. Callers either overwrite this with the real session user
    // (createMockTryOn) or never read it (refreshMockTryOn only uses
    // status/resultImageUrl/completedAt from the reconstructed value).
    userId: "",
    challengeId: payload.c,
    garmentId: payload.g,
    sourceImageUrl: "",
    sourceUploadId: null,
    resultImageUrl: status === "completed" ? resultImages[payload.r] : "",
    resultStoragePath: null,
    providerResultUrl: null,
    status,
    provider: "mock",
    providerTaskId: null,
    errorMessage: null,
    decision: null,
    verdict: verdicts[payload.w],
    createdAt,
    startedAt: createdAt,
    completedAt:
      status === "completed"
        ? new Date(payload.t + PROCESSING_DURATION_MS).toISOString()
        : null,
  }
}

export function isValidSessionId(sessionId: string) {
  return /^session-[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/.test(sessionId)
}

export function isValidChallengeId(challengeId: string) {
  return mockChallenges.some((challenge) => challenge.id === challengeId)
}

export function getGarmentIdForChallenge(challengeId: string) {
  return mockGarmentIdByChallenge[challengeId] ?? null
}

export function createMockTryOn(sessionId: string, challengeId: string, now = Date.now()) {
  if (!isValidSessionId(sessionId) || !isValidChallengeId(challengeId)) return null

  const garmentId = mockGarmentIdByChallenge[challengeId]
  if (!garmentId) return null

  const nonce = randomUUID()
  const seed = hashSeed(`${sessionId}:${challengeId}:${now}:${nonce}`)
  const payload: TryOnTokenPayload = {
    v: 1,
    s: sessionId,
    c: challengeId,
    g: garmentId,
    t: now,
    r: seed % resultImages.length,
    w: Math.floor(seed / resultImages.length) % verdicts.length,
    n: nonce,
  }
  const id = encodePayload(payload)

  return buildTryOn(id, payload, now)
}

export function reconstructMockTryOn(id: string, now = Date.now()) {
  const payload = parsePayload(id, now)
  return payload ? buildTryOn(id, payload, now) : null
}
