"use client"

import Link from "next/link"
import Image from "next/image"
import { Zap, ChevronRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-5 pt-12 pb-8">
      {/* Background decorations */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-10"
        style={{ background: "oklch(0.50 0.22 293)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-40 -left-16 h-48 w-48 rounded-full opacity-8"
        style={{ background: "oklch(0.68 0.19 28)" }}
        aria-hidden="true"
      />

      {/* Logo */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md">
          <Zap className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
        </div>
        <span className="text-2xl font-black tracking-tight text-foreground" style={{ fontFamily: "var(--font-display, sans-serif)" }}>
          Wear<span className="text-primary"> or </span>Dare
        </span>
      </div>

      {/* Tagline */}
      <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-balance" style={{ fontFamily: "var(--font-display, sans-serif)" }}>
        Spin the challenge.{" "}
        <span className="text-primary">Try the look.</span>{" "}
        Dare to wear it.
      </h1>
      <p className="mb-8 text-base leading-relaxed text-muted-foreground text-pretty">
        The AI fashion game where your next outfit is chosen by fate.
      </p>

      {/* Hero image collage */}
      <div className="relative mb-8 overflow-hidden rounded-3xl shadow-xl" style={{ aspectRatio: "4/3" }}>
        <Image
          src="/hero-collage.png"
          alt="Diverse fashion models in bold outfits — the Wear or Dare game"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay badge */}
        <div className="absolute bottom-4 left-4 rounded-2xl bg-foreground/80 px-4 py-2 backdrop-blur-sm">
          <p className="text-sm font-bold text-background">45k+ looks tried this week</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <Link
          href="/photo"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-95 hover:opacity-90"
        >
          <Zap className="h-5 w-5" aria-hidden="true" />
          Start Playing
        </Link>
        <Link
          href="#how-it-works"
          className="flex h-12 w-full items-center justify-center gap-1 rounded-2xl border-2 border-border bg-card text-sm font-semibold text-foreground transition-all active:scale-95 hover:border-primary/50"
        >
          See How It Works
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
