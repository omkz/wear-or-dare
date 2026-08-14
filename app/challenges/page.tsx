"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { BoldnessIndicator } from "@/components/boldness-indicator"
import { challenges } from "@/lib/catalog/challenges"
import type { Challenge } from "@/lib/types"
import { Zap, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES = ["All", "Events", "Decades", "Moods", "Wildcards"] as const
type FilterCategory = (typeof CATEGORIES)[number]

export default function ChallengesPage() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("All")

  const filtered =
    activeCategory === "All"
      ? challenges
      : challenges.filter((c) => c.category === activeCategory)

  const featured = challenges.find((c) => c.id === "ch-006")!
  const moreDares = challenges.filter((c) => c.id !== featured.id).slice(0, 3)

  const handleStart = (challenge: Challenge) => {
    router.push(`/photo?challenge=${encodeURIComponent(challenge.id)}`)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="px-5 pt-12 pb-4">
          <h1
            className="text-3xl font-black tracking-tight text-balance"
            style={{ fontFamily: "var(--font-display, sans-serif)" }}
          >
            Challenges
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick your dare. The AI does the styling.
          </p>
        </header>

        {/* Featured challenge */}
        <div className="px-5 mb-6">
          <div
            className="relative overflow-hidden rounded-3xl p-5 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${featured.color}dd, ${featured.color}99)` }}
          >
            <div className="absolute -top-4 -right-4 text-7xl opacity-30" aria-hidden="true">
              {featured.emoji}
            </div>
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-white/80" aria-hidden="true" />
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">
                  Featured Dare
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "var(--font-display, sans-serif)" }}>
                {featured.title}
              </h2>
              <p className="text-sm text-white/80 leading-relaxed mb-4 text-pretty">
                {featured.description}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => handleStart(featured)}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-bold transition-all active:scale-95"
                  style={{ color: featured.color }}
                >
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  Start Challenge
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* More Dares */}
        <div className="px-5 mb-6">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              More Dares
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {moreDares.map((c) => (
              <button
                key={c.id}
                onClick={() => handleStart(c)}
                className="shrink-0 flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 w-36 text-left transition-all active:scale-95"
              >
                <span className="text-2xl" aria-hidden="true">{c.emoji}</span>
                <p className="text-sm font-bold text-foreground leading-tight">{c.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="px-5 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground hover:border-primary/40"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Challenge list */}
        <div className="px-5 flex flex-col gap-3">
          {filtered.map((challenge) => (
            <div
              key={challenge.id}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                style={{ background: `${challenge.color}20` }}
                aria-hidden="true"
              >
                {challenge.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground text-sm">{challenge.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 text-pretty">
                      {challenge.description}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                    style={{ background: challenge.color }}
                  >
                    {challenge.category}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    <BoldnessIndicator level={challenge.boldness} />
                  </div>
                  <button
                    onClick={() => handleStart(challenge)}
                    className="flex h-8 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground transition-all active:scale-95"
                  >
                    <Zap className="h-3 w-3" aria-hidden="true" />
                    Start
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pb-6 mt-4" />
      </div>
    </AppShell>
  )
}
