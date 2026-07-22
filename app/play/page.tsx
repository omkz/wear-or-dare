"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { usePhotoSession } from "@/components/providers/photo-session-provider"
import { RouletteWheel } from "@/components/roulette-wheel"
import { getAnonymousSessionId } from "@/lib/client/anonymous-session"
import type {
  ApiErrorResponse,
  CreateTryOnRequest,
  CreateTryOnResponse,
} from "@/lib/api-contracts"
import type { Challenge } from "@/lib/types"
import { mockSession, mockTryOns } from "@/lib/mock-data"
import { Flame, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function PlayPage() {
  const router = useRouter()
  const { file, previewUrl, uploadId, imageUrl, isInitialized } = usePhotoSession()
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [creationError, setCreationError] = useState<string | null>(null)

  useEffect(() => {
    if (isInitialized && (!file || !previewUrl || !uploadId || !imageUrl)) {
      router.replace("/photo")
    }
  }, [file, imageUrl, isInitialized, previewUrl, router, uploadId])

  const handleResult = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setCreationError(null)
  }

  const handleContinue = async () => {
    if (!selectedChallenge || !uploadId || isCreating) return

    setIsCreating(true)
    setCreationError(null)

    try {
      const requestBody: CreateTryOnRequest = {
        sessionId: getAnonymousSessionId(),
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
        throw new Error(data.success ? "Could not create your try-on." : data.error)
      }

      router.push(`/generating?id=${encodeURIComponent(data.tryOn.id)}`)
    } catch {
      setCreationError("We couldn’t start your try-on. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const lastResult = mockTryOns[0]

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
          {/* Streak */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-accent/10 px-3 py-2 border border-accent/20">
            <Flame className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-sm font-black text-accent">{mockSession.streak}</span>
            <span className="text-xs text-muted-foreground">day streak</span>
          </div>
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
          <RouletteWheel onResult={handleResult} />
        </div>

        {/* Continue button */}
        <div className="px-5 mt-6">
          <button
            onClick={handleContinue}
            disabled={!selectedChallenge || isCreating}
            className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold shadow-lg transition-all ${
              selectedChallenge && !isCreating
                ? "bg-primary text-primary-foreground active:scale-95 hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isCreating ? (
              "Creating your look…"
            ) : selectedChallenge ? (
              <>
                Try &quot;{selectedChallenge.title}&quot;
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </>
            ) : (
              "Spin to select a challenge"
            )}
          </button>
          {creationError && (
            <p className="mt-3 text-center text-xs font-semibold text-destructive" role="alert">
              {creationError}
            </p>
          )}
        </div>

        {/* Previous result */}
        {lastResult && (
          <div className="px-5 mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Your last look
              </h2>
              <button
                onClick={() => router.push(`/result/${lastResult.id}`)}
                className="flex items-center gap-1 text-xs font-semibold text-primary"
              >
                See result
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
            <div
              className="relative overflow-hidden rounded-2xl shadow-md cursor-pointer active:scale-95 transition-all"
              style={{ height: 180 }}
              onClick={() => router.push(`/result/${lastResult.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/result/${lastResult.id}`)}
              aria-label="View last result"
            >
              <Image
                src={lastResult.resultImageUrl}
                alt="Your previous outfit result"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div>
                  <span className="text-xs text-white/70">First Date challenge</span>
                  <p className="text-sm font-bold text-white">{lastResult.verdict}</p>
                </div>
                <span
                  className={`rounded-xl px-2 py-1 text-xs font-black ${
                    lastResult.decision === "wear"
                      ? "bg-primary text-white"
                      : "bg-accent text-white"
                  }`}
                >
                  {lastResult.decision === "wear" ? "WORE IT" : "DARED"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="pb-6" />
      </div>
    </AppShell>
  )
}
