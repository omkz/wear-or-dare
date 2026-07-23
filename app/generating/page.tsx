"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { X, RefreshCw } from "lucide-react"
import type { ApiErrorResponse, GetTryOnResponse } from "@/lib/api-contracts"
import { loadingMessages } from "@/lib/mock-data"
import type { TryOnStatus } from "@/lib/types"

const FLOAT_ITEMS = ["👗", "👠", "🧥", "👒", "💍", "🕶️", "👜", "✨"]
const MAX_POLL_FAILURES = 3

function GeneratingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tryOnId = searchParams.get("id")
  const stopPollingRef = useRef<() => void>(() => {})

  const [messageIdx, setMessageIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<TryOnStatus>("pending")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pollingRun, setPollingRun] = useState(0)
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!tryOnId) {
      router.replace("/photo")
    }
  }, [router, tryOnId])

  useEffect(() => {
    if (!tryOnId) return

    let active = true
    let pollTimer: number | undefined
    let activeController: AbortController | null = null
    let failureCount = 0

    const stopPolling = () => {
      active = false
      if (pollTimer !== undefined) window.clearTimeout(pollTimer)
      activeController?.abort()
    }

    const scheduleNextPoll = () => {
      if (!active) return
      pollTimer = window.setTimeout(poll, 1000)
    }

    const poll = async () => {
      activeController = new AbortController()

      try {
        const response = await fetch(`/api/try-ons/${encodeURIComponent(tryOnId)}`, {
          signal: activeController.signal,
          cache: "no-store",
        })
        const data: GetTryOnResponse | ApiErrorResponse = await response.json()
        if (!active) return

        if (!response.ok || !data.success) {
          if (response.status === 400 || response.status === 404) {
            router.replace("/photo")
            return
          }
          setErrorMessage(data.success ? "This try-on could not be loaded." : data.error)
          return
        }

        failureCount = 0
        setStatus(data.tryOn.status)
        if (!data.tryOn.sourceImageUrl) {
          setErrorMessage("The source photo for this try-on is unavailable.")
          return
        }
        setSourceImageUrl(data.tryOn.sourceImageUrl)

        if (data.tryOn.status === "failed") {
          setErrorMessage(
            data.tryOn.errorMessage ??
              "The try-on could not be completed. Please try polling again."
          )
          return
        }

        if (data.tryOn.status === "completed") {
          setProgress(100)
          router.replace(`/result/${encodeURIComponent(data.tryOn.id)}`)
          return
        }

        scheduleNextPoll()
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return

        failureCount += 1
        if (failureCount >= MAX_POLL_FAILURES) {
          setErrorMessage("We lost touch with the stylist. Check your connection and try again.")
          return
        }

        scheduleNextPoll()
      }
    }

    stopPollingRef.current = stopPolling
    void poll()

    return () => {
      stopPolling()
      if (stopPollingRef.current === stopPolling) {
        stopPollingRef.current = () => {}
      }
    }
  }, [pollingRun, router, tryOnId])

  useEffect(() => {
    if (!tryOnId || !sourceImageUrl || errorMessage || status === "completed") return

    const messageInterval = window.setInterval(() => {
      setMessageIdx((previous) => (previous + 1) % loadingMessages.length)
    }, 1800)
    const progressInterval = window.setInterval(() => {
      setProgress((previous) => {
        const maximum = status === "pending" ? 35 : 94
        const increment = status === "pending" ? 5 : 8
        return Math.min(previous + increment, maximum)
      })
    }, 300)

    return () => {
      window.clearInterval(messageInterval)
      window.clearInterval(progressInterval)
    }
  }, [errorMessage, sourceImageUrl, status, tryOnId])

  const retryPolling = () => {
    setErrorMessage(null)
    setProgress((previous) => Math.min(previous, 90))
    setMessageIdx(0)
    setStatus("pending")
    setPollingRun((previous) => previous + 1)
  }

  const handleCancel = () => {
    stopPollingRef.current()
    router.push("/play")
  }

  if (!tryOnId) {
    return <div className="min-h-screen bg-background" />
  }

  if (errorMessage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
        <div className="max-w-sm w-full text-center">
          <div className="mb-6 text-6xl" aria-hidden="true">😬</div>
          <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "var(--font-display, sans-serif)" }}>
            Oops, fashion glitch!
          </h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={retryPolling}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-95"
          >
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!sourceImageUrl) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-5">
      {/* Cancel */}
      <button
        onClick={handleCancel}
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
            src={sourceImageUrl}
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
          {status === "pending"
            ? loadingMessages[0]
            : loadingMessages[Math.max(1, messageIdx)]}
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
