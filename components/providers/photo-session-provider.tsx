"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"

export interface PhotoSession {
  file: File | null
  previewUrl: string | null
  fileName: string | null
  mimeType: string | null
  fileSize: number | null
  uploadId: string | null
  imageUrl: string | null
  storagePath: string | null
}

export interface PhotoUpload {
  uploadId: string
  imageUrl: string
  storagePath: string
}

interface PhotoSessionContextValue extends PhotoSession {
  isInitialized: boolean
  setPhoto: (file: File) => void
  setUploadedPhoto: (upload: PhotoUpload) => void
  clearPhoto: () => void
}

const EMPTY_PHOTO_SESSION: PhotoSession = {
  file: null,
  previewUrl: null,
  fileName: null,
  mimeType: null,
  fileSize: null,
  uploadId: null,
  imageUrl: null,
  storagePath: null,
}

const PhotoSessionContext = createContext<PhotoSessionContextValue | null>(null)
const subscribeToHydration = () => () => {}

export function PhotoSessionProvider({ children }: { children: ReactNode }) {
  const [photo, setPhotoState] = useState<PhotoSession>(EMPTY_PHOTO_SESSION)
  const activePreviewUrlRef = useRef<string | null>(null)
  const isInitialized = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  )

  const setPhoto = useCallback((file: File) => {
    const nextPreviewUrl = URL.createObjectURL(file)
    const previousPreviewUrl = activePreviewUrlRef.current

    activePreviewUrlRef.current = nextPreviewUrl
    setPhotoState({
      file,
      previewUrl: nextPreviewUrl,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      uploadId: null,
      imageUrl: null,
      storagePath: null,
    })

    if (previousPreviewUrl) {
      URL.revokeObjectURL(previousPreviewUrl)
    }
  }, [])

  const setUploadedPhoto = useCallback((upload: PhotoUpload) => {
    setPhotoState((current) => ({ ...current, ...upload }))
  }, [])

  const clearPhoto = useCallback(() => {
    const previewUrl = activePreviewUrlRef.current

    activePreviewUrlRef.current = null
    setPhotoState(EMPTY_PHOTO_SESSION)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }, [])

  useEffect(() => {
    return () => {
      const previewUrl = activePreviewUrlRef.current
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        activePreviewUrlRef.current = null
      }
    }
  }, [])

  const value = useMemo<PhotoSessionContextValue>(
    () => ({ ...photo, isInitialized, setPhoto, setUploadedPhoto, clearPhoto }),
    [clearPhoto, isInitialized, photo, setPhoto, setUploadedPhoto]
  )

  return <PhotoSessionContext.Provider value={value}>{children}</PhotoSessionContext.Provider>
}

export function usePhotoSession() {
  const context = useContext(PhotoSessionContext)

  if (!context) {
    throw new Error("usePhotoSession must be used within PhotoSessionProvider")
  }

  return context
}
