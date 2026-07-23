import "server-only"
import type { StoredUpload } from "@/lib/server/local-upload-storage"
import type { TryOn } from "@/lib/types"
import {
  loadGarmentImage,
  type ServerGarment,
} from "@/lib/server/garment-catalog"
import {
  createClothesTask,
  getClothesTaskStatus,
  requestFileUpload,
  uploadBytes,
  validateYouCamConfiguration,
  type YouCamImageContentType,
  type YouCamTaskStatus,
} from "@/lib/server/youcam-client"
import { updateYouCamTryOnState } from "@/lib/server/try-on-repository"
import { localStorageService } from "@/lib/server/storage"

const MAX_YOUCAM_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_YOUCAM_RESULT_SIZE = 15 * 1024 * 1024
const PROVIDER_START_GRACE_MS = 2 * 60 * 1000
const SAFE_FAILED_TASK_MESSAGE = "The virtual try-on could not be completed. Please try again."
const SAFE_MISSING_TASK_MESSAGE = "The virtual try-on task is unavailable. Please try again."

interface YouCamSourceImage {
  bytes: Uint8Array
  contentType: YouCamImageContentType
  fileName: string
}

function prepareSourceImage(upload: StoredUpload): YouCamSourceImage {
  if (upload.bytes.byteLength === 0 || upload.bytes.byteLength >= MAX_YOUCAM_IMAGE_SIZE) {
    throw new Error("Source photo must be non-empty and under 10 MB")
  }

  if (upload.contentType === "image/webp") {
    throw new Error("YouCam requires a JPEG or PNG source photo")
  }

  return {
    bytes: upload.bytes,
    contentType: upload.contentType === "image/png" ? "image/png" : "image/jpg",
    fileName: `source-${upload.uploadId}.${upload.contentType === "image/png" ? "png" : "jpg"}`,
  }
}

async function uploadImage(
  image: { bytes: Uint8Array; contentType: YouCamImageContentType; fileName: string }
) {
  const upload = await requestFileUpload({
    fileName: image.fileName,
    contentType: image.contentType,
    fileSize: image.bytes.byteLength,
  })
  await uploadBytes(upload, image.bytes)
  return upload.fileId
}

export async function createYouCamProviderTask(
  sourceUpload: StoredUpload,
  garment: ServerGarment
) {
  validateYouCamConfiguration()
  const sourceImage = prepareSourceImage(sourceUpload)
  const garmentImage = await loadGarmentImage(garment)
  const [sourceFileId, referenceFileId] = await Promise.all([
    uploadImage(sourceImage),
    uploadImage(garmentImage),
  ])

  return createClothesTask({
    sourceFileId,
    referenceFileId,
    garmentCategory: garment.youCamCategory,
  })
}

function mapYouCamStatus(status: YouCamTaskStatus): TryOn["status"] {
  if (status === "queued" || status === "pending") return "pending"
  if (status === "running" || status === "processing") return "processing"
  if (status === "success") return "completed"
  return "failed"
}

export async function synchronizeYouCamTryOn(tryOn: TryOn) {
  if (
    tryOn.provider !== "youcam" ||
    tryOn.status === "completed" ||
    tryOn.status === "failed"
  ) {
    return tryOn
  }

  if (!tryOn.providerTaskId) {
    const age = Date.now() - new Date(tryOn.createdAt).getTime()
    if (tryOn.status === "pending" && age < PROVIDER_START_GRACE_MS) {
      return tryOn
    }

    return updateYouCamTryOnState(tryOn.id, {
      status: "failed",
      errorMessage: SAFE_MISSING_TASK_MESSAGE,
      completedAt: new Date(),
    })
  }

  if (tryOn.resultStoragePath && tryOn.resultImageUrl) {
    return updateYouCamTryOnState(tryOn.id, {
      status: "completed",
      errorMessage: null,
      completedAt: tryOn.completedAt ? new Date(tryOn.completedAt) : new Date(),
    })
  }

  let providerResultUrl = tryOn.providerResultUrl
  if (!providerResultUrl) {
    const providerResult = await getClothesTaskStatus(tryOn.providerTaskId)
    const status = mapYouCamStatus(providerResult.status)

    if (status === "failed") {
      return updateYouCamTryOnState(tryOn.id, {
        status,
        errorMessage: SAFE_FAILED_TASK_MESSAGE,
        completedAt: new Date(),
      })
    }

    if (status !== "completed") {
      if (status === tryOn.status) return tryOn
      return updateYouCamTryOnState(tryOn.id, {
        status,
        errorMessage: null,
        completedAt: null,
      })
    }

    providerResultUrl = providerResult.resultUrl
    if (!providerResultUrl) {
      return updateYouCamTryOnState(tryOn.id, {
        status: "failed",
        errorMessage: SAFE_FAILED_TASK_MESSAGE,
        completedAt: new Date(),
      })
    }

    const savedProviderResult = await updateYouCamTryOnState(tryOn.id, {
      status: "processing",
      providerResultUrl,
      errorMessage: null,
      completedAt: null,
    })
    if (!savedProviderResult) return null
  }

  const storedResult = await localStorageService.saveRemoteImage({
    bucket: "results",
    url: providerResultUrl,
    maxBytes: MAX_YOUCAM_RESULT_SIZE,
  })

  try {
    const updated = await updateYouCamTryOnState(tryOn.id, {
      status: "completed",
      resultImageUrl: storedResult.publicUrl,
      resultStoragePath: storedResult.storagePath,
      providerResultUrl,
      errorMessage: null,
      completedAt: new Date(),
    })
    if (!updated) {
      await localStorageService.deleteFile("results", storedResult.filename)
    }
    return updated
  } catch (error) {
    await localStorageService.deleteFile("results", storedResult.filename)
    throw error
  }
}
