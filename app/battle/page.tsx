"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { AppShell } from "@/components/app-shell"
import { mockBattle } from "@/lib/mock-data"
import type { Battle } from "@/lib/types"
import { Share2, RefreshCw, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BattlePage() {
  const router = useRouter()
  const [battle, setBattle] = useState<Battle>(mockBattle)
  const [voted, setVoted] = useState<"A" | "B" | null>(null)
  const [animating, setAnimating] = useState<"A" | "B" | null>(null)

  const total = battle.outfitAVotes + battle.outfitBVotes
  const percentA = Math.round((battle.outfitAVotes / total) * 100)
  const percentB = 100 - percentA

  const handleVote = async (choice: "A" | "B") => {
    if (voted) return
    setAnimating(choice)
    setTimeout(() => {
      setVoted(choice)
      setAnimating(null)
      setBattle((prev) => ({
        ...prev,
        outfitAVotes: choice === "A" ? prev.outfitAVotes + 1 : prev.outfitAVotes,
        outfitBVotes: choice === "B" ? prev.outfitBVotes + 1 : prev.outfitBVotes,
      }))
    }, 300)
  }

  const handleNewBattle = () => {
    setVoted(null)
    setAnimating(null)
    setBattle({
      ...mockBattle,
      outfitAImageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&h=900&fit=crop",
      outfitBImageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=900&fit=crop",
      outfitAChallengeTitle: "Villain Era",
      outfitBChallengeTitle: "Quiet Luxury",
      outfitAVotes: 734,
      outfitBVotes: 1102,
      userVote: null,
    })
  }

  const updatedTotal = battle.outfitAVotes + battle.outfitBVotes
  const updatedPercentA = Math.round((battle.outfitAVotes / updatedTotal) * 100)
  const updatedPercentB = 100 - updatedPercentA

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="px-5 pt-12 pb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Style Battle
          </p>
          <h1
            className="text-3xl font-black tracking-tight text-balance"
            style={{ fontFamily: "var(--font-display, sans-serif)" }}
          >
            Which look slaps harder?
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {voted ? "The people have spoken." : "Tap to vote."}
          </p>
        </header>

        {/* Battle cards */}
        <div className="px-5">
          <div className="grid grid-cols-2 gap-3">
            {(["A", "B"] as const).map((side) => {
              const isA = side === "A"
              const imgUrl = isA ? battle.outfitAImageUrl : battle.outfitBImageUrl
              const title = isA ? battle.outfitAChallengeTitle : battle.outfitBChallengeTitle
              const pct = voted ? (isA ? updatedPercentA : updatedPercentB) : (isA ? percentA : percentB)
              const isWinner = voted && (isA ? updatedPercentA > updatedPercentB : updatedPercentB > updatedPercentA)
              const isVoted = voted === side

              return (
                <button
                  key={side}
                  onClick={() => handleVote(side)}
                  disabled={!!voted}
                  className={cn(
                    "relative overflow-hidden rounded-3xl transition-all",
                    animating === side && "scale-95",
                    !voted && "active:scale-95 cursor-pointer",
                    voted && "cursor-default",
                    isVoted && "ring-4 ring-primary ring-offset-2",
                    voted && isWinner && "ring-4 ring-accent ring-offset-2"
                  )}
                  style={{ aspectRatio: "2/3" }}
                  aria-label={`Vote for outfit ${side}: ${title}`}
                >
                  <Image src={imgUrl} alt={`Outfit ${side}: ${title}`} fill className="object-cover" />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Challenge label */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wide block">
                      {title}
                    </span>
                    {voted && (
                      <div className="mt-1">
                        <p className="text-2xl font-black text-white">{pct}%</p>
                        {isWinner && (
                          <span className="text-xs font-bold text-accent">WINNER</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* VS badge */}
                  {!voted && (
                    <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/80 backdrop-blur-sm">
                      <span className="text-[10px] font-black text-background">{side}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* VS divider (when not voted) */}
          {!voted && (
            <div className="flex items-center justify-center -mt-2 mb-2 relative z-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground shadow-lg">
                <span className="text-sm font-black text-background">VS</span>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {voted && (
          <div className="px-5 mt-6">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  {(updatedTotal).toLocaleString()} votes cast
                </span>
              </div>
              {/* Bar chart */}
              <div className="space-y-2">
                {[
                  { label: battle.outfitAChallengeTitle, pct: updatedPercentA, side: "A" },
                  { label: battle.outfitBChallengeTitle, pct: updatedPercentB, side: "B" },
                ].map((item) => (
                  <div key={item.side}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-foreground">{item.label}</span>
                      <span className="text-primary">{item.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-5 mt-6 flex flex-col gap-3">
          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-semibold text-foreground transition-all active:scale-95"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Ask Your Friends
          </button>
          <button
            onClick={handleNewBattle}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-lg transition-all active:scale-95"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Another Battle
          </button>
        </div>

        <div className="pb-6" />
      </div>
    </AppShell>
  )
}
