"use client"

const SESSION_STORAGE_KEY = "wear-or-dare:anonymous-session-id"
const SESSION_ID_PATTERN = /^session-[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/

function createFallbackId() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export function getAnonymousSessionId() {
  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (existing && SESSION_ID_PATTERN.test(existing)) return existing

  const identifier = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : createFallbackId()
  const sessionId = `session-${identifier}`
  sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  return sessionId
}
