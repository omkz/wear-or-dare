"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { usePhotoSession } from "@/components/providers/photo-session-provider"
import { RouletteWheel } from "@/components/roulette-wheel"
import { authClient } from "@/lib/client/auth-client"
import { getAnonymousSessionId } from "@/lib/client/anonymous-session"
import {
  clearPendingTryOn,
  readPendingTryOn,
  savePendingTryOn,
  type PendingTryOnIntent,
} from "@/lib/client/pending-try-on"
import type {
  ApiErrorResponse,
  CreateTryOnRequest,
  CreateTryOnResponse,
} from "@/lib/api-contracts"
import type { Challenge } from "@/lib/types"
import {
  mockChallenges,
  mockGarmentIdByChallenge,
  mockGarments,
} from "@/lib/mock-data"
import { ArrowRight, History as HistoryIcon } from "lucide-react"
import Image from "next/image"

function readInitialPendingTryOn() {
  return typeof window === "undefined" ? null : readPendingTryOn()
}

export default function PlayPage() {
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const { file, previewUrl, uploadId, imageUrl, isInitialized } = usePhotoSession()
  const [pendingIntent, setPendingIntent] = useState<PendingTryOnIntent | null>(
    readInitialPendingTryOn
  )
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(() =>
    pendingIntent
      ? mockChallenges.find((item) => item.id === pendingIntent.challengeId) ?? null
      : null
  )
  const [wheelRun, setWheelRun] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [creationError, setCreationError] = useState<string | null>(null)
  const creationInFlightRef = useRef(false)
  const creationRequestIdRef = useRef<string | null>(pendingIntent?.requestId ?? null)

  const effectiveUploadId = pendingIntent?.sourceUploadId ?? uploadId

  const selectedGarment = selectedChallenge
    ? mockGarments.find(
        (garment) => garment.id === mockGarmentIdByChallenge[selectedChallenge.id]
      ) ?? null
    : null

  useEffect(() => {
    if (isInitialized && !pendingIntent && (!file || !previewUrl || !uploadId || !imageUrl)) {
      router.replace("/photo")
    }
  }, [file, imageUrl, isInitialized, pendingIntent, previewUrl, router, uploadId])

  const submitTryOn = useCallback(
    async (requestBody: CreateTryOnRequest) => {
      creationInFlightRef.current = true
      setIsCreating(true)
      setCreationError(null)

      try {
        const response = await fetch("/api/try-ons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })
        const data: CreateTryOnResponse | ApiErrorResponse = await response.json()

        if (!response.ok || !data.success) {
          setCreationError(
            data.success ? "We couldn’t start your try-on. Please try again." : data.error
          )
          return
        }

        clearPendingTryOn()
        setPendingIntent(null)
        router.push(`/generating?id=${encodeURIComponent(data.tryOn.id)}`)
      } catch {
        setCreationError(
          "We couldn’t reach the server. Check your connection and try again."
        )
      } finally {
        creationInFlightRef.current = false
        setIsCreating(false)
      }
    },
    [router]
  )

  useEffect(() => {
    if (!pendingIntent || isSessionPending || !session || creationInFlightRef.current) return

    void submitTryOn({
      requestId: pendingIntent.requestId,
      sessionId: pendingIntent.sessionId,
      challengeId: pendingIntent.challengeId,
      sourceUploadId: pendingIntent.sourceUploadId,
    })
  }, [pendingIntent, isSessionPending, session, submitTryOn])

  const handleResult = (challenge: Challenge) => {
    creationRequestIdRef.current = null
    setSelectedChallenge(challenge)
    setCreationError(null)
  }

  const handleSpinAgain = () => {
    if (creationInFlightRef.current) return

    creationRequestIdRef.current = null
    clearPendingTryOn()
    setPendingIntent(null)
    setSelectedChallenge(null)
    setCreationError(null)
    setWheelRun((current) => current + 1)
  }

  const handleTryThisLook = async () => {
    if (
      !selectedChallenge ||
      !selectedGarment ||
      !effectiveUploadId ||
      creationInFlightRef.current ||
      isSessionPending
    ) {
      return
    }

    const requestId = creationRequestIdRef.current ?? crypto.randomUUID()
    creationRequestIdRef.current = requestId
    const requestBody: CreateTryOnRequest = {
      requestId,
      sessionId: pendingIntent?.sessionId ?? getAnonymousSessionId(),
      challengeId: selectedChallenge.id,
      sourceUploadId: effectiveUploadId,
    }

    if (!session) {
      savePendingTryOn(requestBody)
      setPendingIntent(requestBody)
      router.push("/login?returnTo=%2Fplay")
      return
    }

    await submitTryOn(requestBody)
  }

  if (
    !isInitialized ||
    (!pendingIntent && (!file || !previewUrl || !uploadId || !imageUrl))
  ) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-12 pb-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
              Ready?
            </p>
            <h1
              className="text-2xl font-black tracking-tight text-balance"
              style={{ fontFamily: "var(--font-display, sans-serif)" }}
            >
              Today&apos;s Style Dare
            </h1>
          </div>
          <button
            onClick={() => router.push("/history")}
            className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground transition-all active:scale-95"
          >
            <HistoryIcon className="h-4 w-4 text-primary" aria-hidden="true" />
            History
          </button>
        </header>

        {/* Challenge categories strip */}
        <div className="px-5 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {["First Date", "Quiet Luxury", "90s Streetwear", "Festival Mode", "Cyberpunk", "Main Character"].map((cat) => (
              <span
                key={cat}
                className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Roulette */}
        <div className="px-5 flex flex-col items-center">
          <RouletteWheel
            key={wheelRun}
            onResult={handleResult}
            disabled={Boolean(selectedChallenge) || isCreating}
          />
        </div>

        {/* Selected look */}
        <div className="px-5 mt-6">
          {selectedChallenge && selectedGarment ? (
            <div className="pop-in overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
              <div className="flex gap-4 p-4">
                <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-secondary">
                  <Image
                    src={selectedGarment.imageUrl}
                    alt={selectedGarment.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    {selectedChallenge.title}
                  </p>
                  <h2 className="text-xl font-black leading-tight text-foreground">
                    {selectedGarment.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedGarment.brand} · {selectedGarment.category}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border-t border-border p-4">
                <button
                  onClick={handleSpinAgain}
                  disabled={isCreating}
                  className="flex h-12 flex-1 items-center justify-center rounded-2xl border-2 border-border bg-background text-sm font-semibold text-foreground transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Spin Again
                </button>
                <button
                  onClick={handleTryThisLook}
                  disabled={isCreating || isSessionPending}
                  className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? "Creating…" : "Try This Look"}
                  {!isCreating && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-14 w-full items-center justify-center rounded-2xl bg-muted text-sm font-bold text-muted-foreground">
              Spin to select a challenge
            </div>
          )}

          {selectedChallenge && !selectedGarment && (
            <p className="mt-3 text-center text-xs font-semibold text-destructive" role="alert">
              This challenge does not have an available garment.
            </p>
          )}
          {creationError && (
            <p className="mt-3 text-center text-xs font-semibold text-destructive" role="alert">
              {creationError}
            </p>
          )}
        </div>

        <div className="pb-6" />
      </div>
    </AppShell>
  )
}
