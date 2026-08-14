"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { BoldnessIndicator } from "@/components/boldness-indicator"
import { usePhotoSession } from "@/components/providers/photo-session-provider"
import { RouletteWheel } from "@/components/roulette-wheel"
import { authClient } from "@/lib/client/auth-client"
import type {
  ApiErrorResponse,
  CreateTryOnRequest,
  CreateTryOnResponse,
} from "@/lib/api-contracts"
import type { Challenge } from "@/lib/types"
import { challenges, getChallengeById } from "@/lib/catalog/challenges"
import { getGarmentForChallenge } from "@/lib/catalog/garments"
import { ArrowRight, History as HistoryIcon } from "lucide-react"
import Image from "next/image"

function PlayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const { file, previewUrl, uploadId, imageUrl, isInitialized } = usePhotoSession()
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(() =>
    getChallengeById(searchParams.get("challenge") ?? "")
  )
  const [wheelRun, setWheelRun] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [creationError, setCreationError] = useState<string | null>(null)
  const creationInFlightRef = useRef(false)
  const creationRequestIdRef = useRef<string | null>(null)

  const selectedGarment = selectedChallenge
    ? getGarmentForChallenge(selectedChallenge.id)
    : null

  useEffect(() => {
    if (isInitialized && (!file || !previewUrl || !uploadId || !imageUrl)) {
      router.replace("/photo")
    }
  }, [file, imageUrl, isInitialized, previewUrl, router, uploadId])

  const handleResult = (challenge: Challenge) => {
    creationRequestIdRef.current = null
    setSelectedChallenge(challenge)
    setCreationError(null)
  }

  const handleSpinAgain = () => {
    if (creationInFlightRef.current) return

    creationRequestIdRef.current = null
    setSelectedChallenge(null)
    setCreationError(null)
    setWheelRun((current) => current + 1)
  }

  const handleTryThisLook = async () => {
    if (
      !selectedChallenge ||
      !selectedGarment ||
      !uploadId ||
      creationInFlightRef.current ||
      isSessionPending
    ) {
      return
    }

    if (!session) {
      router.push("/login")
      return
    }

    creationInFlightRef.current = true
    setIsCreating(true)
    setCreationError(null)

    try {
      const requestId = creationRequestIdRef.current ?? crypto.randomUUID()
      creationRequestIdRef.current = requestId
      const requestBody: CreateTryOnRequest = {
        requestId,
        challengeId: selectedChallenge.id,
        sourceUploadId: uploadId,
      }
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

      router.push(`/generating?id=${encodeURIComponent(data.tryOn.id)}`)
    } catch {
      setCreationError(
        "We couldn’t reach the server. Check your connection and try again."
      )
    } finally {
      creationInFlightRef.current = false
      setIsCreating(false)
    }
  }

  if (!isInitialized || !file || !previewUrl || !uploadId || !imageUrl) {
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

        {/* Progress */}
        <div className="px-5 mb-6">
          <span className="sr-only">Step 2 of 3</span>
          <div className="flex gap-1.5" aria-hidden="true">
            <div className="h-1.5 flex-1 rounded-full bg-primary" />
            <div className="h-1.5 flex-1 rounded-full bg-primary" />
            <div className="h-1.5 flex-1 rounded-full bg-border" />
          </div>
        </div>

        {/* Challenge categories strip */}
        <div className="px-5 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {challenges.slice(0, 6).map((challenge) => (
              <span
                key={challenge.id}
                className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                {challenge.emoji} {challenge.title}
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
              {/* Challenge reveal */}
              <div className="flex items-start gap-3 border-b border-border bg-secondary/40 px-4 py-3">
                <span className="text-2xl leading-none" aria-hidden="true">
                  {selectedChallenge.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Your Dare
                  </p>
                  <h2 className="truncate text-sm font-black text-foreground">
                    {selectedChallenge.title}
                  </h2>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {selectedChallenge.description}
                  </p>
                </div>
                <BoldnessIndicator level={selectedChallenge.boldness} className="mt-1 shrink-0" />
              </div>

              {/* Garment reveal */}
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
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Featured Piece
                  </p>
                  <h3 className="text-xl font-black leading-tight text-foreground">
                    {selectedGarment.name}
                  </h3>
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
                  {isCreating ? "Generating…" : "Generate This Look"}
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

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PlayContent />
    </Suspense>
  )
}
