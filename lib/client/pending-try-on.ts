"use client"

const STORAGE_KEY = "wear-or-dare:pending-try-on"
const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SESSION_ID_PATTERN = /^session-[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/

export interface PendingTryOnIntent {
  requestId: string
  sessionId: string
  challengeId: string
  sourceUploadId: string
}

function isPendingTryOnIntent(value: unknown): value is PendingTryOnIntent {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>

  return (
    typeof record.requestId === "string" &&
    REQUEST_ID_PATTERN.test(record.requestId) &&
    typeof record.sessionId === "string" &&
    SESSION_ID_PATTERN.test(record.sessionId) &&
    typeof record.challengeId === "string" &&
    record.challengeId.length > 0 &&
    typeof record.sourceUploadId === "string" &&
    record.sourceUploadId.length > 0
  )
}

export function savePendingTryOn(intent: PendingTryOnIntent) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent))
}

export function readPendingTryOn(): PendingTryOnIntent | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    return isPendingTryOnIntent(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function clearPendingTryOn() {
  sessionStorage.removeItem(STORAGE_KEY)
}
