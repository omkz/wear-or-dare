"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Camera,
  ImagePlus,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Shield,
  RotateCcw,
  ArrowRight,
  User,
} from "lucide-react"
import { usePhotoSession } from "@/components/providers/photo-session-provider"
import type {
  ApiErrorResponse,
  UploadPhotoResponse,
} from "@/lib/api-contracts"

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const ACCEPTED_IMAGE_TYPES_ATTRIBUTE = "image/jpeg,image/png,image/webp"
const MAX_FILE_SIZE = 10 * 1024 * 1024

const tips = [
  { icon: CheckCircle, text: "Stand facing the camera", ok: true },
  { icon: CheckCircle, text: "Keep your full body visible", ok: true },
  { icon: CheckCircle, text: "Use good lighting", ok: true },
  { icon: XCircle, text: "Avoid crowded backgrounds", ok: false },
]

export default function PhotoPage() {
  const router = useRouter()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const { file, previewUrl, setPhoto, setUploadedPhoto, clearPhoto } = usePhotoSession()
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setValidationError("Please choose an image file.")
      return
    }

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setValidationError("Only JPEG, PNG, and WebP images are supported.")
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError("Photo must be 10 MB or smaller.")
      return
    }

    setValidationError(null)
    setUploadError(null)
    setPhoto(file)
  }, [setPhoto])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleContinue = async () => {
    if (!file || !previewUrl || isUploading) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", file, file.name)

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      })
      const data: UploadPhotoResponse | ApiErrorResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.success ? "Upload failed" : data.error)
      }

      setUploadedPhoto({
        uploadId: data.uploadId,
        imageUrl: data.imageUrl,
        storagePath: data.storagePath,
      })
      router.push("/play")
    } catch {
      setUploadError("We couldn’t upload your photo. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRetake = () => {
    setValidationError(null)
    setUploadError(null)
    clearPhoto()
    cameraInputRef.current?.click()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-all active:scale-95"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight" style={{ fontFamily: "var(--font-display, sans-serif)" }}>
              Upload Your Photo
            </h1>
            <p className="text-xs text-muted-foreground">Step 1 of 3</p>
          </div>
        </header>

        {/* Progress */}
        <div className="px-5 mb-6">
          <div className="flex gap-1.5">
            <div className="h-1.5 flex-1 rounded-full bg-primary" />
            <div className="h-1.5 flex-1 rounded-full bg-border" />
            <div className="h-1.5 flex-1 rounded-full bg-border" />
          </div>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES_ATTRIBUTE}
          capture="environment"
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Take a photo with the rear-facing camera"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES_ATTRIBUTE}
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Choose a photo from gallery"
        />

        {!file || !previewUrl ? (
          <>
            {/* Upload area */}
            <div className="px-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 transition-all ${
                  isDragging ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
                style={{ minHeight: 300 }}
                role="region"
                aria-label="Photo upload area"
              >
                {/* Silhouette guide */}
                <div className="mb-5 flex h-36 w-20 items-center justify-center rounded-2xl bg-secondary" aria-hidden="true">
                  <User className="h-20 w-20 text-muted-foreground/30" />
                </div>
                <p className="text-center text-sm font-semibold text-foreground mb-1">
                  Full-body photo required
                </p>
                <p className="text-center text-xs text-muted-foreground mb-6">
                  Drag & drop or choose from options below
                </p>

                <div className="flex w-full flex-col gap-3">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground transition-all active:scale-95"
                  >
                    <Camera className="h-5 w-5" aria-hidden="true" />
                    Take a Photo
                  </button>
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background text-sm font-semibold text-foreground transition-all active:scale-95"
                  >
                    <ImagePlus className="h-5 w-5" aria-hidden="true" />
                    Choose from Gallery
                  </button>
                </div>

                {validationError && (
                  <p className="mt-3 text-center text-xs font-semibold text-destructive" role="alert">
                    {validationError}
                  </p>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="px-5 mt-6">
              <h2 className="mb-3 text-sm font-bold text-foreground uppercase tracking-wider">
                For best results
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {tips.map((tip, i) => {
                  const Icon = tip.icon
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-xl bg-card p-3 border border-border"
                    >
                      <Icon
                        className={`h-4 w-4 mt-0.5 shrink-0 ${tip.ok ? "text-primary" : "text-accent"}`}
                        aria-hidden="true"
                      />
                      <span className="text-xs text-foreground leading-tight">{tip.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          /* Photo preview */
          <div className="px-5">
            <div className="relative overflow-hidden rounded-3xl shadow-xl" style={{ aspectRatio: "3/4" }}>
              <Image src={previewUrl} alt="Your uploaded photo" fill className="object-cover" />
              {/* Success badge */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                <span className="text-xs font-bold text-white">Photo ready</span>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleRetake}
                disabled={isUploading}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card text-sm font-semibold text-foreground transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Retake
              </button>
              <button
                onClick={handleContinue}
                disabled={!file || !previewUrl || isUploading}
                className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? "Uploading…" : "Continue"}
                {!isUploading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>

            {uploadError && (
              <p className="mt-3 text-center text-xs font-semibold text-destructive" role="alert">
                {uploadError}
              </p>
            )}

            {/* Privacy note */}
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-card border border-border p-3">
              <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your photo is stored locally for this try-on and is never shared.
              </p>
            </div>
          </div>
        )}

        <div className="pb-12" />
      </div>
    </div>
  )
}
