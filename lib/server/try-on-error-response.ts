import "server-only"
import { GarmentImageError } from "@/lib/server/garment-catalog"
import { TryOnProviderConfigurationError } from "@/lib/server/try-on-provider"
import { YouCamApiError } from "@/lib/server/youcam-client"

export interface SafeTryOnError {
  message: string
  status: number
}

const PROVIDER_CONFIGURATION_MESSAGE =
  "The try-on provider is not configured. Check the server configuration and try again."

function getSafeProviderCode(error: YouCamApiError) {
  const code = error.errorCode?.trim()
  return code && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(code)
    ? ` (code: ${code})`
    : ""
}

export function getSafeTryOnCreateError(error: unknown): SafeTryOnError {
  if (error instanceof GarmentImageError) {
    return {
      message:
        "The selected garment image is unavailable. Choose another look and try again.",
      status: 422,
    }
  }

  if (error instanceof TryOnProviderConfigurationError) {
    return { message: PROVIDER_CONFIGURATION_MESSAGE, status: 503 }
  }

  if (error instanceof YouCamApiError) {
    if (
      error.message === "YOUCAM_API_KEY is required" ||
      error.statusCode === 401 ||
      error.statusCode === 403
    ) {
      return { message: PROVIDER_CONFIGURATION_MESSAGE, status: 503 }
    }

    const normalizedMessage = error.message.toLowerCase()
    if (
      normalizedMessage.includes("network error") ||
      normalizedMessage.includes("timed out") ||
      normalizedMessage.includes("cancelled")
    ) {
      return {
        message:
          "The server couldn’t reach YouCam. Check the network connection and try again.",
        status: normalizedMessage.includes("timed out") ? 504 : 502,
      }
    }

    if (normalizedMessage.includes("malformed")) {
      return {
        message: "YouCam returned an invalid response. Please try again.",
        status: 502,
      }
    }

    if (error.statusCode === 429) {
      return {
        message: "YouCam is receiving too many requests. Please wait and try again.",
        status: 429,
      }
    }

    if (
      error.statusCode === 400 ||
      error.statusCode === 409 ||
      error.statusCode === 413 ||
      error.statusCode === 422
    ) {
      return {
        message: `YouCam rejected the try-on request${getSafeProviderCode(error)}. Check the photo and garment, then try again.`,
        status: 422,
      }
    }

    return {
      message: `YouCam could not start the try-on${getSafeProviderCode(error)}. Please try again.`,
      status: 502,
    }
  }

  return {
    message: "The virtual try-on could not be started. Please try again.",
    status: 500,
  }
}
