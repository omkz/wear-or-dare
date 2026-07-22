"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { AppShell } from "@/components/app-shell"
import { mockSavedLooks } from "@/lib/mock-data"
import type { SavedLook } from "@/lib/types"
import { Heart, Share2, Swords, Trash2, BookmarkX } from "lucide-react"
import { cn } from "@/lib/utils"

const FILTERS = ["All", "Wear", "Dare", "Favorites"] as const
type Filter = (typeof FILTERS)[number]

export default function SavedPage() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<Filter>("All")
  const [looks, setLooks] = useState<SavedLook[]>(mockSavedLooks)

  const filtered = looks.filter((look) => {
    if (activeFilter === "Wear") return look.decision === "wear"
    if (activeFilter === "Dare") return look.decision === "dare"
    if (activeFilter === "Favorites") return look.isFavorite
    return true
  })

  const toggleFavorite = (id: string) => {
    setLooks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isFavorite: !l.isFavorite } : l))
    )
  }

  const deleteLook = (id: string) => {
    setLooks((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="px-5 pt-12 pb-4">
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-display, sans-serif)" }}
          >
            Your Saved Looks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {looks.length} look{looks.length !== 1 ? "s" : ""} saved
          </p>
        </header>

        {/* Filter tabs */}
        <div className="px-5 mb-4">
          <div className="flex gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary" aria-hidden="true">
              <BookmarkX className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Nothing saved yet</h2>
            <p className="text-sm text-muted-foreground mb-6 text-pretty leading-relaxed">
              {activeFilter === "Favorites"
                ? "Heart your favorite looks to find them here."
                : "Play a challenge and save your results."}
            </p>
            <button
              onClick={() => router.push("/play")}
              className="flex h-12 items-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg transition-all active:scale-95"
            >
              Start Playing
            </button>
          </div>
        ) : (
          <div className="px-5 grid grid-cols-2 gap-3">
            {filtered.map((look) => (
              <div
                key={look.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                {/* Image */}
                <div
                  className="relative cursor-pointer"
                  style={{ aspectRatio: "2/3" }}
                  onClick={() => router.push(`/result/${look.tryOnId}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/result/${look.tryOnId}`)}
                  aria-label={`View ${look.challengeTitle} look`}
                >
                  <Image
                    src={look.resultImageUrl}
                    alt={`${look.challengeTitle} outfit look`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Challenge label */}
                  <div className="absolute top-2 left-2">
                    <span className="rounded-full bg-foreground/80 px-2 py-0.5 text-[9px] font-bold text-background uppercase tracking-wide">
                      {look.challengeTitle}
                    </span>
                  </div>

                  {/* Decision badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-black text-white uppercase",
                        look.decision === "wear" ? "bg-primary" : "bg-accent"
                      )}
                    >
                      {look.decision === "wear" ? "Wore" : "Dare"}
                    </span>
                  </div>

                  {/* Verdict */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs font-bold text-white leading-tight">{look.verdict}</p>
                  </div>
                </div>

                {/* Actions bar */}
                <div className="flex items-center justify-around border-t border-border p-2">
                  <button
                    onClick={() => toggleFavorite(look.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90"
                    aria-label={look.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4 transition-colors",
                        look.isFavorite ? "text-accent fill-accent" : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    onClick={() => router.push("/battle")}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90"
                    aria-label="Compare this look"
                  >
                    <Swords className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90"
                    aria-label="Share this look"
                  >
                    <Share2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => deleteLook(look.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-90"
                    aria-label="Delete this look"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pb-6 mt-4" />
      </div>
    </AppShell>
  )
}
