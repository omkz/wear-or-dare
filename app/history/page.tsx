"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History as HistoryIcon,
  RefreshCw,
} from "lucide-react"
import { AppShell } from "@/components/app-shell"
import type {
  ApiErrorResponse,
  GetTryOnHistoryResponse,
} from "@/lib/api-contracts"
import { getAnonymousSessionId } from "@/lib/client/anonymous-session"
import { mockChallenges, mockGarments } from "@/lib/mock-data"
import type { TryOn } from "@/lib/types"
import { cn } from "@/lib/utils"

const statusDetails: Record<
  TryOn["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-secondary text-muted-foreground",
  },
  processing: {
    label: "Generating",
    className: "bg-primary/10 text-primary",
  },
  completed: {
    label: "Ready",
    className: "bg-green-500/10 text-green-700",
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/10 text-destructive",
  },
}

function formatCreationDate(createdAt: string) {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return "Date unavailable"

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export default function HistoryPage() {
  const router = useRouter()
  const [tryOns, setTryOns] = useState<TryOn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const loadHistory = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const sessionId = getAnonymousSessionId()
        const response = await fetch(
          `/api/try-ons/history?sessionId=${encodeURIComponent(sessionId)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        )
        const data: GetTryOnHistoryResponse | ApiErrorResponse = await response.json()
        if (!active) return

        if (!response.ok || !data.success) {
          setError(data.success ? "Unable to load try-on history." : data.error)
          return
        }

        setTryOns(data.tryOns)
      } catch (requestError) {
        if (
          !active ||
          (requestError instanceof DOMException && requestError.name === "AbortError")
        ) {
          return
        }
        setError("We couldn’t load your try-on history. Please try again.")
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadHistory()
    return () => {
      active = false
      controller.abort()
    }
  }, [reloadKey])

  const openTryOn = (tryOn: TryOn) => {
    if (tryOn.status === "completed") {
      router.push(`/result/${encodeURIComponent(tryOn.id)}`)
      return
    }
    if (tryOn.status === "pending" || tryOn.status === "processing") {
      router.push(`/generating?id=${encodeURIComponent(tryOn.id)}`)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <header className="flex items-center gap-3 px-5 pt-12 pb-5">
          <button
            onClick={() => router.push("/play")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-all active:scale-95"
            aria-label="Back to play"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div>
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ fontFamily: "var(--font-display, sans-serif)" }}
            >
              Try-on History
            </h1>
            <p className="text-xs text-muted-foreground">
              Looks created in this browser tab
            </p>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-3 px-5" aria-label="Loading try-on history">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="flex animate-pulse gap-4 rounded-2xl border border-border bg-card p-3"
              >
                <div className="h-28 w-20 shrink-0 rounded-xl bg-secondary" />
                <div className="flex flex-1 flex-col justify-center gap-3">
                  <div className="h-3 w-20 rounded-full bg-secondary" />
                  <div className="h-5 w-2/3 rounded-full bg-secondary" />
                  <div className="h-3 w-1/2 rounded-full bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-lg font-bold">History unavailable</h2>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {error}
            </p>
            <button
              onClick={() => setReloadKey((current) => current + 1)}
              className="flex h-12 items-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg transition-all active:scale-95"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try Again
            </button>
          </div>
        ) : tryOns.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary">
              <HistoryIcon className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-lg font-bold">No try-ons yet</h2>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Upload a photo and spin the roulette to create your first look.
            </p>
            <button
              onClick={() => router.push("/photo")}
              className="flex h-12 items-center rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg transition-all active:scale-95"
            >
              Upload a Photo
            </button>
          </div>
        ) : (
          <div className="space-y-3 px-5">
            {tryOns.map((tryOn) => {
              const challenge = mockChallenges.find(
                (item) => item.id === tryOn.challengeId
              )
              const garment = mockGarments.find((item) => item.id === tryOn.garmentId)
              const imageUrl = tryOn.resultImageUrl || tryOn.sourceImageUrl
              const status = statusDetails[tryOn.status]
              const isActionable = tryOn.status !== "failed"

              const content = (
                <>
                  <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`${challenge?.title ?? "Try-on"} preview`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Clock3
                          className="h-7 w-7 text-muted-foreground/40"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                      {tryOn.decision && (
                        <span
                          className={cn(
                            "text-[10px] font-black uppercase tracking-wide",
                            tryOn.decision === "wear" ? "text-primary" : "text-accent"
                          )}
                        >
                          {tryOn.decision === "wear" ? "Wear It" : "Dare Again"}
                        </span>
                      )}
                    </div>
                    <h2 className="truncate text-base font-black text-foreground">
                      {challenge?.title ?? "Unknown challenge"}
                    </h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {garment?.name ?? "Unknown garment"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatCreationDate(tryOn.createdAt)}
                    </p>
                    {tryOn.status === "failed" && (
                      <p className="mt-1 text-xs font-semibold text-destructive">
                        This try-on could not be completed.
                      </p>
                    )}
                  </div>
                  {isActionable && (
                    <ChevronRight
                      className="h-5 w-5 shrink-0 self-center text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </>
              )

              return isActionable ? (
                <button
                  key={tryOn.id}
                  onClick={() => openTryOn(tryOn)}
                  className="flex w-full gap-4 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-all active:scale-[0.98]"
                >
                  {content}
                </button>
              ) : (
                <div
                  key={tryOn.id}
                  className="flex gap-4 rounded-2xl border border-destructive/20 bg-card p-3 opacity-90"
                >
                  {content}
                </div>
              )
            })}
          </div>
        )}

        <div className="pb-6" />
      </div>
    </AppShell>
  )
}
