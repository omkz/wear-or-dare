"use client"

import { useEffect, useState, type ComponentType } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import {
  AlertCircle,
  ChevronLeft,
  Download,
  LogIn,
  Share2,
  Zap,
} from "lucide-react"
import type { ApiErrorResponse, GetTryOnResponse } from "@/lib/api-contracts"
import { getChallengeById } from "@/lib/catalog/challenges"
import { getGarmentById } from "@/lib/catalog/garments"
import type { TryOn } from "@/lib/types"

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return slug || "look"
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

function extensionForMimeType(mimeType: string) {
  return MIME_EXTENSIONS[mimeType.toLowerCase()] ?? "png"
}

async function fetchResultImageFile(resultImageUrl: string, baseFileName: string) {
  const response = await fetch(resultImageUrl)
  if (!response.ok) throw new Error("Unable to fetch result image")
  const blob = await response.blob()
  const contentType = blob.type || "image/png"
  const fileName = `${baseFileName}.${extensionForMimeType(contentType)}`
  return new File([blob], fileName, { type: contentType })
}

interface StatusScreenProps {
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  title: string
  message?: string
  actionLabel: string
  onAction: () => void
}

function StatusScreen({ icon: Icon, title, message, actionLabel, onAction }: StatusScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-foreground px-5 text-center">
      <div className="max-w-sm w-full">
        {Icon && (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10">
            <Icon className="h-8 w-8 text-white/70" aria-hidden={true} />
          </div>
        )}
        <h1 className="mb-2 text-xl font-black text-white">{title}</h1>
        {message && <p className="mb-6 text-sm text-white/60">{message}</p>}
        <button
          onClick={onAction}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground transition-all active:scale-95"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

export default function SharePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [tryOn, setTryOn] = useState<TryOn | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

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

        if (response.status === 401) {
          setUnauthorized(true)
          return
        }

        if (!response.ok || !data.success) {
          setLoadError(data.success ? "This look could not be loaded." : data.error)
          return
        }

        if (data.tryOn.status !== "completed" || !data.tryOn.resultImageUrl) {
          router.replace(`/generating?id=${encodeURIComponent(id)}`)
          return
        }

        setTryOn(data.tryOn)
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return
        setLoadError("We couldn’t load this look. Please try again.")
      }
    }

    void loadTryOn()
    return () => {
      active = false
      controller.abort()
    }
  }, [id, router])

  if (unauthorized) {
    return (
      <StatusScreen
        icon={LogIn}
        title="Sign in to view this look"
        message="This look is tied to your account. Sign in to share it."
        actionLabel="Sign in"
        onAction={() => router.push("/login")}
      />
    )
  }

  if (loadError) {
    return (
      <StatusScreen
        icon={AlertCircle}
        title="Look not found"
        message={loadError}
        actionLabel="Back to History"
        onAction={() => router.push("/history")}
      />
    )
  }

  if (!tryOn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foreground">
        <div
          className="h-8 w-8 animate-spin rounded-full border-3 border-white/30 border-t-white"
          aria-label="Loading look"
        />
      </div>
    )
  }

  const challenge = getChallengeById(tryOn.challengeId)
  const garment = getGarmentById(tryOn.garmentId)

  if (!challenge || !garment) {
    return (
      <StatusScreen
        icon={AlertCircle}
        title="Look details unavailable"
        actionLabel="Back to History"
        onAction={() => router.push("/history")}
      />
    )
  }

  const baseFileName = `wear-or-dare-${slugify(challenge.title)}`
  const caption = `I tried the ${challenge.title} challenge on Wear or Dare. Would you wear it or dare me to try again?`

  const handleShare = async () => {
    if (isSharing) return
    setIsSharing(true)
    setShareError(null)

    try {
      const file = await fetchResultImageFile(tryOn.resultImageUrl, baseFileName)

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Wear or Dare", text: caption })
      } else if (navigator.share) {
        await navigator.share({ title: "Wear or Dare", text: caption })
      } else {
        setShareError("Sharing isn’t supported on this device. Use Download Image instead.")
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      setShareError("We couldn’t share this look. Try downloading it instead.")
    } finally {
      setIsSharing(false)
    }
  }

  const handleDownload = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    setDownloadError(null)

    let objectUrl: string | null = null
    try {
      const file = await fetchResultImageFile(tryOn.resultImageUrl, baseFileName)
      objectUrl = URL.createObjectURL(file)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      setDownloadError("We couldn’t download this image. Please try again.")
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setIsDownloading(false)
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
                Featured piece
              </p>
              <p className="text-sm font-bold text-white/90 mb-3">{garment.name}</p>

              {tryOn.verdict && (
                <>
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">
                    My verdict
                  </p>
                  <h2
                    className="text-2xl font-black text-white leading-tight mb-3 text-balance"
                    style={{ fontFamily: "var(--font-display, sans-serif)" }}
                  >
                    {tryOn.verdict}
                  </h2>
                </>
              )}

              {/* Decision pill */}
              {tryOn.decision && (
                <div
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 ${
                    tryOn.decision === "wear" ? "bg-primary" : "bg-accent"
                  }`}
                >
                  <span className="text-base font-black text-white">
                    {tryOn.decision === "wear" ? "I chose WEAR IT" : "I chose DARE AGAIN"}
                  </span>
                </div>
              )}

              {/* Tagline */}
              <p className="mt-3 text-xs text-white/50">
                Wear or Dare · Spin the challenge. Try the look.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-10 flex flex-col gap-3">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Share2 className="h-5 w-5" aria-hidden="true" />
            {isSharing ? "Sharing…" : "Share"}
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/20 bg-white/10 text-base font-bold text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-5 w-5" aria-hidden="true" />
            {isDownloading ? "Downloading…" : "Download Image"}
          </button>

          {(shareError || downloadError) && (
            <p className="text-center text-xs font-semibold text-white/80" role="alert">
              {shareError || downloadError}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
