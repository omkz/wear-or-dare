"use client"

import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { mockTryOns, mockChallenges } from "@/lib/mock-data"
import { ChevronLeft, Download, Share2, Zap, ExternalLink } from "lucide-react"

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const tryOn = mockTryOns.find((t) => t.id === id) ?? mockTryOns[0]
  const challenge = mockChallenges.find((c) => c.id === tryOn.challengeId) ?? mockChallenges[0]

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Wear or Dare",
          text: `I took the ${challenge.title} challenge! ${tryOn.verdict} — ${tryOn.decision === "wear" ? "I wore it!" : "I dared again!"}`,
          url: window.location.href,
        })
      } catch {
        // User cancelled
      }
    }
  }

  return (
    <div className="min-h-screen bg-foreground flex flex-col">
      <div className="mx-auto w-full max-w-sm flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-12 pb-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-all active:scale-95"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <p className="text-sm font-bold text-white/80">Share Your Look</p>
          <div className="w-10" />
        </header>

        {/* Story-format card */}
        <div className="flex-1 px-5 pb-4">
          <div
            className="relative overflow-hidden rounded-3xl shadow-2xl"
            style={{ aspectRatio: "9/16" }}
            aria-label="Share card preview"
          >
            {/* Background image */}
            <Image
              src={tryOn.resultImageUrl}
              alt={`${challenge.title} outfit virtual try-on`}
              fill
              className="object-cover"
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

            {/* Top: Brand */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-lg">
                  <Zap className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <span className="text-base font-black text-white" style={{ fontFamily: "var(--font-display, sans-serif)" }}>
                  Wear or Dare
                </span>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ background: challenge.color ?? "#7C3AED" }}
              >
                {challenge.title}
              </span>
            </div>

            {/* Decorative sticker */}
            <div
              className="absolute top-1/3 right-4 -rotate-12 rounded-2xl bg-primary/90 px-3 py-2 shadow-xl backdrop-blur-sm"
              aria-hidden="true"
            >
              <p className="text-xs font-black text-white leading-tight">AI<br />STYLED</p>
            </div>

            {/* Bottom: Result */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">
                My verdict
              </p>
              <h2
                className="text-2xl font-black text-white leading-tight mb-3 text-balance"
                style={{ fontFamily: "var(--font-display, sans-serif)" }}
              >
                {tryOn.verdict}
              </h2>

              {/* Decision pill */}
              <div
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 ${
                  tryOn.decision === "wear" ? "bg-primary" : "bg-accent"
                }`}
              >
                <span className="text-base font-black text-white">
                  {tryOn.decision === "wear" ? "I chose WEAR IT" : "I chose DARE AGAIN"}
                </span>
              </div>

              {/* Tagline */}
              <p className="mt-3 text-xs text-white/50">
                wearordare.app · Spin the challenge. Try the look.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-10 flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-white shadow-lg transition-all active:scale-95"
          >
            <Share2 className="h-5 w-5" aria-hidden="true" />
            Share
          </button>
          <div className="flex gap-3">
            <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 text-sm font-semibold text-white transition-all active:scale-95">
              <Download className="h-4 w-4" aria-hidden="true" />
              Save Image
            </button>
            <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 text-sm font-semibold text-white transition-all active:scale-95">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Story
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
