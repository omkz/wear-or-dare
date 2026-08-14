"use client"

import { useState, useRef, useCallback, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { getChallengeById } from "@/lib/catalog/challenges"
import type {
  ApiErrorResponse,
  UploadPhotoResponse,
} from "@/lib/api-contracts"

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"])
const ACCEPTED_IMAGE_TYPES_ATTRIBUTE = "image/jpeg,image/png"
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_CAPTURE_DIMENSION = 2048

const tips = [
  { icon: CheckCircle, text: "Stand facing the camera", ok: true },
  { icon: CheckCircle, text: "Keep your full body visible", ok: true },
  { icon: CheckCircle, text: "Use good lighting", ok: true },
  { icon: XCircle, text: "Avoid crowded backgrounds", ok: false },
]

function PhotoPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedChallenge = getChallengeById(searchParams.get("challenge") ?? "")
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const cameraRequestRef = useRef(0)
  const isMountedRef = useRef(true)
  const { file, previewUrl, setPhoto, setUploadedPhoto, clearPhoto } = usePhotoSession()
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [hasProcessingConsent, setHasProcessingConsent] = useState(false)

  const stopCamera = useCallback(() => {
    cameraRequestRef.current += 1
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    cameraStreamRef.current = null
    setCameraStream(null)
    setIsStartingCamera(false)
    setIsCapturing(false)
  }, [])

  const handleFile = useCallback((file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setValidationError("Unsupported photo format. Please choose a JPEG or PNG photo.")
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError("This photo is too large. Please choose one that is 10 MB or smaller.")
      return
    }

    setValidationError(null)
    setUploadError(null)
    setCameraError(null)
    setHasProcessingConsent(false)
    stopCamera()
    setPhoto(file)
  }, [setPhoto, stopCamera])

  const startCamera = useCallback(async () => {
    setValidationError(null)
    setUploadError(null)
    setCameraError(null)

    if (!window.isSecureContext) {
      setCameraError("Camera access requires localhost or a secure HTTPS connection.")
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click()
      return
    }

    stopCamera()
    const requestId = cameraRequestRef.current + 1
    cameraRequestRef.current = requestId
    setIsStartingCamera(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 1920 },
        },
      })

      if (!isMountedRef.current || cameraRequestRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      cameraStreamRef.current = stream
      setCameraStream(stream)
    } catch (error) {
      if (!isMountedRef.current || cameraRequestRef.current !== requestId) return

      const errorName = error instanceof DOMException ? error.name : ""
      if (errorName === "NotAllowedError") {
        setCameraError("Camera access was denied. Allow camera permission and try again.")
      } else if (errorName === "NotFoundError") {
        setCameraError("No camera was found on this device.")
      } else if (errorName === "NotReadableError") {
        setCameraError("The camera is already in use by another application.")
      } else {
        setCameraError("We couldn’t open the camera. Please try again or choose a photo.")
      }
    } finally {
      if (isMountedRef.current && cameraRequestRef.current === requestId) {
        setIsStartingCamera(false)
      }
    }
  }, [stopCamera])

  const capturePhoto = async () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0 || isCapturing) {
      setCameraError("The camera is still getting ready. Please try again.")
      return
    }

    setIsCapturing(true)
    setCameraError(null)

    try {
      const scale = Math.min(
        1,
        MAX_CAPTURE_DIMENSION / Math.max(video.videoWidth, video.videoHeight)
      )
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Canvas is unavailable")

      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) resolve(result)
            else reject(new Error("Photo capture failed"))
          },
          "image/jpeg",
          0.9
        )
      })
      const capturedFile = new File([blob], `camera-${Date.now()}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      })

      handleFile(capturedFile)
    } catch {
      setCameraError("We couldn’t capture the photo. Please try again.")
      setIsCapturing(false)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video || !cameraStream) return

    video.srcObject = cameraStream
    void video.play().catch(() => {
      setCameraError("The camera preview could not start. Please try again.")
    })

    return () => {
      if (video.srcObject === cameraStream) video.srcObject = null
    }
  }, [cameraStream])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      cameraRequestRef.current += 1
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
    }
  }, [])

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
    if (!file || !previewUrl || !hasProcessingConsent || isUploading) return

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
      router.push(
        selectedChallenge
          ? `/play?challenge=${encodeURIComponent(selectedChallenge.id)}`
          : "/play"
      )
    } catch {
      setUploadError("We couldn’t upload your photo. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRetake = () => {
    setValidationError(null)
    setUploadError(null)
    setHasProcessingConsent(false)
    clearPhoto()
    void startCamera()
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
                {cameraStream ? (
                  <div className="w-full">
                    <div className="relative mx-auto mb-5 aspect-[3/4] w-full max-w-xs overflow-hidden rounded-2xl bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="h-full w-full object-contain"
                        aria-label="Live camera preview"
                      />
                    </div>
                    <p className="mb-4 text-center text-xs text-muted-foreground">
                      Keep your full body inside the frame
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          stopCamera()
                          setCameraError(null)
                        }}
                        disabled={isCapturing}
                        className="flex h-12 flex-1 items-center justify-center rounded-2xl border-2 border-border bg-background text-sm font-semibold text-foreground transition-all active:scale-95 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => void capturePhoto()}
                        disabled={isCapturing}
                        className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground transition-all active:scale-95 disabled:opacity-60"
                      >
                        <Camera className="h-5 w-5" aria-hidden="true" />
                        {isCapturing ? "Capturing…" : "Capture Photo"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Silhouette guide */}
                    <div className="mb-5 flex h-36 w-20 items-center justify-center rounded-2xl bg-secondary" aria-hidden="true">
                      <User className="h-20 w-20 text-muted-foreground/30" />
                    </div>
                    <p className="text-center text-sm font-semibold text-foreground mb-1">
                      Full-body photo required
                    </p>
                    <p className="text-center text-xs text-muted-foreground mb-6">
                      Drag &amp; drop or choose a JPG/PNG below · up to 10MB
                    </p>

                    <div className="flex w-full flex-col gap-3">
                      <button
                        onClick={() => void startCamera()}
                        disabled={isStartingCamera}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Camera className="h-5 w-5" aria-hidden="true" />
                        {isStartingCamera ? "Opening Camera…" : "Take a Photo"}
                      </button>
                      <button
                        onClick={() => {
                          stopCamera()
                          galleryInputRef.current?.click()
                        }}
                        disabled={isStartingCamera}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background text-sm font-semibold text-foreground transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ImagePlus className="h-5 w-5" aria-hidden="true" />
                        Choose from Gallery
                      </button>
                    </div>
                  </>
                )}

                {(validationError || cameraError) && (
                  <p className="mt-3 text-center text-xs font-semibold text-destructive" role="alert">
                    {validationError ?? cameraError}
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

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3">
              <input
                type="checkbox"
                checked={hasProcessingConsent}
                onChange={(event) => setHasProcessingConsent(event.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span className="text-xs leading-relaxed text-foreground">
                I agree that my photo may be processed by YouCam to generate the virtual try-on.
              </span>
            </label>

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
                disabled={!file || !previewUrl || !hasProcessingConsent || isUploading}
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
                Your photo is stored for this try-on and may be sent to YouCam for AI
                processing. It is not publicly shared.
              </p>
            </div>
          </div>
        )}

        <div className="pb-12" />
      </div>
    </div>
  )
}

export default function PhotoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PhotoPageContent />
    </Suspense>
  )
}
