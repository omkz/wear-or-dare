"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import {
  Heart,
  Share2,
  Swords,
  ShoppingBag,
  RotateCcw,
  Check,
  Zap,
  ChevronLeft,
} from "lucide-react"
import { mockTryOns, mockChallenges, mockGarments } from "@/lib/mock-data"
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
  const params = useParams()
  const id = params.id as string

  const tryOn = mockTryOns.find((t) => t.id === id) ?? mockTryOns[0]
  const challenge = mockChallenges.find((c) => c.id === tryOn.challengeId) ?? mockChallenges[0]
  const garment = mockGarments.find((g) => g.id === tryOn.garmentId) ?? mockGarments[0]

  const [decision, setDecision] = useState<"wear" | "dare" | null>(tryOn.decision)
  const [saved, setSaved] = useState(false)
  const [celebrating, setCelebrating] = useState(false)

  const handleWear = () => {
    setDecision("wear")
    setCelebrating(true)
    setSaved(true)
    setTimeout(() => setCelebrating(false), 1500)
  }

  const handleDare = () => {
    setDecision("dare")
    router.push("/play")
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
          <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={() => setSaved(!saved)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-sm transition-all active:scale-95",
                saved ? "bg-accent text-white" : "bg-black/40 text-white"
              )}
              aria-label={saved ? "Unsave look" : "Save look"}
            >
              <Heart className={cn("h-5 w-5", saved && "fill-current")} aria-hidden="true" />
            </button>
            <button
              onClick={() => router.push("/result/" + id + "/share")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm text-white transition-all active:scale-95"
              aria-label="Share this look"
            >
              <Share2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
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
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Featured piece
              </p>
              <p className="font-bold text-foreground mt-0.5">{garment.name}</p>
              <p className="text-sm text-muted-foreground">{garment.brand}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-foreground">${garment.price}</p>
              <button className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary">
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                View item
              </button>
            </div>
          </div>

          {/* Decision buttons */}
          {decision === null ? (
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleDare}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-accent bg-accent/10 text-base font-bold text-accent transition-all active:scale-95"
              >
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
                Dare Again
              </button>
              <button
                onClick={handleWear}
                className="flex h-14 flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-95 pulse-ring"
              >
                <Zap className="h-5 w-5" aria-hidden="true" />
                Wear It
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

          {/* Secondary actions */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            <button
              onClick={() => router.push("/saved")}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 transition-all active:scale-95"
            >
              <Heart className={cn("h-5 w-5", saved ? "text-accent fill-accent" : "text-muted-foreground")} aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground">Save</span>
            </button>
            <button
              onClick={() => router.push("/battle")}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 transition-all active:scale-95"
            >
              <Swords className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground">Compare</span>
            </button>
            <button
              onClick={() => router.push("/result/" + id + "/share")}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3 transition-all active:scale-95"
            >
              <Share2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
