"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { X, RefreshCw } from "lucide-react"
import { loadingMessages } from "@/lib/mock-data"

const FLOAT_ITEMS = ["👗", "👠", "🧥", "👒", "💍", "🕶️", "👜", "✨"]

function GeneratingContent() {
  const router = useRouter()

  const [messageIdx, setMessageIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(false)

  const startGeneration = useCallback(() => {
    // Cycle messages
    const msgInterval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % loadingMessages.length)
    }, 1800)

    // Progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return prev + Math.random() * 8
      })
    }, 300)

    // Simulate completion after 4s
    const completionTimer = setTimeout(() => {
      clearInterval(msgInterval)
      clearInterval(progressInterval)
      setProgress(100)

      setTimeout(() => {
        // Use a mock result ID — in production, use the actual try-on ID
        router.push("/result/tryon-001")
      }, 500)
    }, 4000)

    return () => {
      clearInterval(msgInterval)
      clearInterval(progressInterval)
      clearTimeout(completionTimer)
    }
  }, [router])

  useEffect(() => {
    const cleanup = startGeneration()
    return cleanup
  }, [startGeneration])

  const retryGeneration = () => {
    setError(false)
    setProgress(0)
    setMessageIdx(0)
    startGeneration()
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
        <div className="max-w-sm w-full text-center">
          <div className="mb-6 text-6xl" aria-hidden="true">😬</div>
          <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "var(--font-display, sans-serif)" }}>
            Oops, fashion glitch!
          </h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            The AI stylist needed a coffee break. Let&apos;s try that again.
          </p>
          <button
            onClick={retryGeneration}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-95"
          >
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-5">
      {/* Cancel */}
      <button
        onClick={() => router.push("/play")}
        className="absolute top-12 right-5 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-all active:scale-95"
        aria-label="Cancel and go back"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Floating clothing items */}
      {FLOAT_ITEMS.map((item, i) => (
        <div
          key={i}
          className="pointer-events-none absolute text-3xl"
          style={{
            left: `${8 + (i % 4) * 24}%`,
            top: `${10 + Math.floor(i / 4) * 60}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${2.5 + (i % 3) * 0.5}s`,
            animation: `float ${2.5 + (i % 3) * 0.5}s ease-in-out ${i * 0.4}s infinite`,
            opacity: 0.5,
          }}
          aria-hidden="true"
        >
          {item}
        </div>
      ))}

      <div className="max-w-sm w-full text-center">
        {/* Blurred photo preview */}
        <div className="relative mx-auto mb-8 h-48 w-36 overflow-hidden rounded-3xl shadow-xl">
          <Image
            src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop"
            alt=""
            fill
            className="object-cover"
            style={{ filter: "blur(8px)" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 rounded-full border-3 border-white/70 border-t-transparent animate-spin" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2
          className="text-2xl font-black tracking-tight mb-4 text-balance"
          style={{ fontFamily: "var(--font-display, sans-serif)" }}
          aria-live="polite"
          aria-atomic="true"
        >
          {loadingMessages[messageIdx]}
        </h2>

        {/* Progress bar */}
        <div className="mx-auto mb-6 h-2 w-full max-w-xs overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Generation progress"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          {Math.round(progress)}% complete · AI is styling your look
        </p>
      </div>
    </div>
  )
}

export default function GeneratingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <GeneratingContent />
    </Suspense>
  )
}
