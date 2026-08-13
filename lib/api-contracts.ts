import type { TryOn } from "@/lib/types"

export interface CreateTryOnRequest {
  requestId: string
  challengeId: string
  sourceUploadId: string
}

export interface UploadPhotoResponse {
  success: true
  uploadId: string
  imageUrl: string
  storagePath: string
}

export interface CreateTryOnResponse {
  success: true
  tryOn: TryOn
}

export interface GetTryOnResponse {
  success: true
  tryOn: TryOn
}

export interface GetTryOnHistoryResponse {
  success: true
  tryOns: TryOn[]
}

export interface UpdateTryOnDecisionRequest {
  decision: "wear" | "dare"
}

export interface UpdateTryOnDecisionResponse {
  success: true
  tryOnId: string
  decision: "wear" | "dare"
}

export interface ApiErrorResponse {
  success: false
  error: string
}
