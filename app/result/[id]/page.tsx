"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  RotateCcw,
  Check,
  Zap,
  ChevronLeft,
  History as HistoryIcon,
  Share2,
} from "lucide-react"
import type {
  ApiErrorResponse,
  GetTryOnResponse,
  UpdateTryOnDecisionRequest,
  UpdateTryOnDecisionResponse,
} from "@/lib/api-contracts"
import { getChallengeById } from "@/lib/catalog/challenges"
import { getGarmentById } from "@/lib/catalog/garments"
import type { TryOn } from "@/lib/types"
import { cn } from "@/lib/utils"

const styleTagsByChallenge: Record<string, string[]> = {
  "ch-001": ["Flirty", "Confident", "Date-ready"],
  "ch-002": ["Understated", "Elegant", "Timeless"],
  "ch-003": ["Retro", "Bold", "Nostalgic"],
  "ch-004": ["Festival", "Free-spirited", "Vibrant"],
  "ch-005": ["Futuristic", "Edgy", "Corporate"],
  "ch-006": ["Iconic", "Commanding", "Unforgettable"],
}

export default function ResultPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const celebrationTimerRef = useRef<number | null>(null)

  const [tryOn, setTryOn] = useState<TryOn | null>(null)
  const [decision, setDecision] = useState<"wear" | "dare" | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const [isSavingDecision, setIsSavingDecision] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [decisionError, setDecisionError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const loadTryOn = async () => {
      try {
        const response = await fetch(`/api/try-ons/${encodeURIComponent(id)}`, {
          signal: controller.signal,
          cache: "no-store",
        })
        const data: GetTryOnResponse | ApiErrorResponse = await response.json()
        if (!active) return

        if (!response.ok || !data.success) {
          setLoadError(data.success ? "This try-on could not be loaded." : data.error)
          return
        }

        if (data.tryOn.status !== "completed" || !data.tryOn.resultImageUrl) {
          router.replace(`/generating?id=${encodeURIComponent(id)}`)
          return
        }

        setTryOn(data.tryOn)
        setDecision(data.tryOn.decision)
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return
        setLoadError("We couldn’t load this try-on. Please try again.")
      }
    }

    void loadTryOn()
    return () => {
      active = false
      controller.abort()
    }
  }, [id, router])

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current !== null) {
        window.clearTimeout(celebrationTimerRef.current)
      }
    }
  }, [])

  const handleDecision = async (nextDecision: "wear" | "dare") => {
    if (!tryOn || isSavingDecision) return

    setIsSavingDecision(true)
    setDecisionError(null)

    try {
      const requestBody: UpdateTryOnDecisionRequest = { decision: nextDecision }
      const response = await fetch(`/api/try-ons/${encodeURIComponent(tryOn.id)}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
      const data: UpdateTryOnDecisionResponse | ApiErrorResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.success ? "The decision could not be saved." : data.error)
      }

      setDecision(data.decision)
      setTryOn((current) => current ? { ...current, decision: data.decision } : current)

      if (data.decision === "dare") {
        router.push("/play")
        return
      }

      setCelebrating(true)
      celebrationTimerRef.current = window.setTimeout(() => setCelebrating(false), 1500)
    } catch {
      setDecisionError("We couldn’t save that choice. Please try again.")
    } finally {
      setIsSavingDecision(false)
    }
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="w-full max-w-sm text-center">
          <div className="mb-5 text-6xl" aria-hidden="true">🫥</div>
          <h1 className="mb-2 text-2xl font-black">Look not found</h1>
          <p className="mb-6 text-sm text-muted-foreground">{loadError}</p>
          <button
            onClick={() => router.push("/play")}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground"
          >
            Back to Play
          </button>
        </div>
      </div>
    )
  }

  if (!tryOn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary/30 border-t-primary" aria-label="Loading result" />
      </div>
    )
  }

  const challenge = getChallengeById(tryOn.challengeId)
  const garment = getGarmentById(tryOn.garmentId)
  if (!challenge || !garment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 text-center">
        <div>
          <h1 className="mb-2 text-2xl font-black">Look details unavailable</h1>
          <button onClick={() => router.push("/play")} className="text-sm font-bold text-primary">
            Back to Play
          </button>
        </div>
      </div>
    )
  }

  const tags = styleTagsByChallenge[challenge.id] ?? ["Bold", "Stylish", "Unexpected"]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg">
        {/* Back button overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-5 pt-12 max-w-lg mx-auto pointer-events-none">
          <button
            onClick={() => router.push("/play")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm text-white transition-all active:scale-95 pointer-events-auto"
            aria-label="Back to play"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            onClick={() => router.push("/history")}
            className="pointer-events-auto flex h-10 items-center gap-2 rounded-xl bg-black/40 px-3 text-xs font-bold text-white backdrop-blur-sm transition-all active:scale-95"
          >
            <HistoryIcon className="h-4 w-4" aria-hidden="true" />
            History
          </button>
        </div>

        {/* Result image */}
        <div className="relative" style={{ height: "70vh", minHeight: 500, maxHeight: 700 }}>
          <Image
            src={tryOn.resultImageUrl}
            alt={`Virtual try-on result for ${challenge.title} challenge`}
            fill
            className="object-cover"
            priority
          />

          {/* Celebration overlay */}
          {celebrating && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm">
              <div className="pop-in text-center">
                <div className="text-6xl mb-3" aria-hidden="true">🎉</div>
                <p className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display, sans-serif)" }}>
                  Wearing it!
                </p>
              </div>
            </div>
          )}

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

          {/* Challenge label */}
          <div className="absolute top-[calc(env(safe-area-inset-top,0px)+60px)] left-1/2 -translate-x-1/2">
            <span
              className="rounded-full px-4 py-2 text-xs font-black text-white uppercase tracking-widest"
              style={{ background: challenge.color ?? "#7C3AED" }}
            >
              {challenge.title}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 -mt-6 relative z-10">
          {/* Verdict */}
          <div className="mb-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Verdict
            </p>
            <h1
              className="text-3xl font-black tracking-tight text-balance leading-none mb-1"
              style={{ fontFamily: "var(--font-display, sans-serif)" }}
            >
              {tryOn.verdict}
            </h1>

            {/* Style tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Product card */}
          <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Featured piece
              </p>
              <p className="font-bold text-foreground mt-0.5">{garment.name}</p>
              <p className="text-sm text-muted-foreground">{garment.category}</p>
            </div>
          </div>

          {/* Decision buttons */}
          {decision === null ? (
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => handleDecision("dare")}
                disabled={isSavingDecision}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-accent bg-accent/10 text-base font-bold text-accent transition-all active:scale-95"
              >
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
                {isSavingDecision ? "Saving…" : "Dare Again"}
              </button>
              <button
                onClick={() => handleDecision("wear")}
                disabled={isSavingDecision}
                className="flex h-14 flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-95 pulse-ring"
              >
                <Zap className="h-5 w-5" aria-hidden="true" />
                {isSavingDecision ? "Saving…" : "Wear It"}
              </button>
            </div>
          ) : (
            <div
              className={cn(
                "mb-4 flex h-14 items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg",
                decision === "wear" ? "bg-primary" : "bg-accent"
              )}
            >
              <Check className="h-5 w-5" aria-hidden="true" />
              {decision === "wear" ? "You chose to WEAR IT!" : "You DARED AGAIN!"}
            </div>
          )}
          {decisionError && (
            <p className="mb-4 text-center text-xs font-semibold text-destructive" role="alert">
              {decisionError}
            </p>
          )}

          {/* Share */}
          <Link
            href={`/result/${encodeURIComponent(tryOn.id)}/share`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card text-sm font-semibold text-foreground transition-all active:scale-95"
          >
            <Share2 className="h-4 w-4 text-primary" aria-hidden="true" />
            Share This Look
          </Link>

          <div className="mb-8" />
        </div>
      </div>
    </div>
  )
}
