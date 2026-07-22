import "server-only"

const DEFAULT_BASE_URL = "https://yce-api-01.makeupar.com"
const DEFAULT_REQUEST_TIMEOUT_MS = 60_000
const DEFAULT_POLL_INTERVAL_MS = 2_000
const DEFAULT_POLL_TIMEOUT_MS = 5 * 60_000

export const YOUCAM_GARMENT_CATEGORIES = [
  "auto",
  "full_body",
  "upper_body",
  "lower_body",
  "shoes",
] as const

export type YouCamGarmentCategory = (typeof YOUCAM_GARMENT_CATEGORIES)[number]
export type YouCamImageContentType = "image/jpg" | "image/png"
export type YouCamTaskStatus = "running" | "success" | "error"

export interface YouCamClientOptions {
  apiKey?: string
  baseUrl?: string
  fetchImpl?: typeof fetch
  requestTimeoutMs?: number
  signal?: AbortSignal
}

export interface RequestFileUploadInput {
  fileName: string
  contentType: YouCamImageContentType
  fileSize: number
}

export interface YouCamFileUpload {
  fileId: string
  fileName: string
  contentType: YouCamImageContentType
  fileSize: number
  uploadUrl: string
  uploadHeaders: Record<string, string>
}

export interface CreateClothesTaskInput {
  sourceFileId: string
  referenceFileId: string
  garmentCategory: YouCamGarmentCategory
}

export interface YouCamTaskResult {
  taskId: string
  status: YouCamTaskStatus
  resultUrl: string | null
  errorCode: string | null
  errorMessage: string | null
}

export interface YouCamSuccessfulTask extends YouCamTaskResult {
  status: "success"
  resultUrl: string
  errorCode: null
  errorMessage: null
}

export interface PollClothesTaskOptions {
  intervalMs?: number
  timeoutMs?: number
  signal?: AbortSignal
  onStatus?: (status: YouCamTaskResult) => void
}

interface ResolvedClientOptions {
  apiKey: string
  baseUrl: string
  fetchImpl: typeof fetch
  requestTimeoutMs: number
  signal?: AbortSignal
}

interface ApiErrorDetails {
  message: string
  code: string | null
}

export class YouCamApiError extends Error {
  readonly statusCode: number | null
  readonly errorCode: string | null

  constructor(
    message: string,
    options: { statusCode?: number; errorCode?: string; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause })
    this.name = "YouCamApiError"
    this.statusCode = options.statusCode ?? null
    this.errorCode = options.errorCode ?? null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0
}

function requireNonEmptyString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new YouCamApiError(`Malformed YouCam response: missing ${label}`)
  }

  return value
}

function requireHttpsUrl(value: unknown, label: string) {
  const rawUrl = requireNonEmptyString(value, label)

  try {
    const url = new URL(rawUrl)
    if (url.protocol !== "https:") throw new Error("Expected HTTPS")
    return url.toString()
  } catch (cause) {
    throw new YouCamApiError(`Malformed YouCam response: invalid ${label}`, { cause })
  }
}

function parseHeaders(value: unknown) {
  if (!isRecord(value)) {
    throw new YouCamApiError("Malformed YouCam response: missing upload headers")
  }

  const headers: Record<string, string> = {}
  for (const [name, headerValue] of Object.entries(value)) {
    if (typeof headerValue !== "string") {
      throw new YouCamApiError("Malformed YouCam response: invalid upload header")
    }
    headers[name] = headerValue
  }

  return headers
}

function getApiErrorDetails(value: unknown): ApiErrorDetails {
  if (!isRecord(value)) return { message: "Unknown API error", code: null }

  const nestedError = isRecord(value.error) ? value.error : null
  const messageCandidates = [
    typeof value.error === "string" ? value.error : null,
    typeof value.message === "string" ? value.message : null,
    nestedError && typeof nestedError.message === "string" ? nestedError.message : null,
    nestedError && typeof nestedError.error === "string" ? nestedError.error : null,
  ]
  const codeCandidates = [
    typeof value.error_code === "string" ? value.error_code : null,
    typeof value.code === "string" ? value.code : null,
    nestedError && typeof nestedError.error_code === "string" ? nestedError.error_code : null,
    nestedError && typeof nestedError.code === "string" ? nestedError.code : null,
  ]

  return {
    message: messageCandidates.find((candidate): candidate is string => Boolean(candidate)) ?? "Unknown API error",
    code: codeCandidates.find((candidate): candidate is string => Boolean(candidate)) ?? null,
  }
}

function resolveClientOptions(options: YouCamClientOptions = {}): ResolvedClientOptions {
  const apiKey = (options.apiKey ?? process.env.YOUCAM_API_KEY ?? "").trim()
  if (!apiKey) {
    throw new YouCamApiError("YOUCAM_API_KEY is required")
  }

  const baseUrlValue = (
    options.baseUrl ?? process.env.YOUCAM_API_BASE_URL ?? DEFAULT_BASE_URL
  ).trim()
  let baseUrl: string

  try {
    const parsed = new URL(baseUrlValue)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("Unsupported protocol")
    }
    baseUrl = parsed.toString().replace(/\/$/, "")
  } catch (cause) {
    throw new YouCamApiError("YOUCAM_API_BASE_URL must be a valid HTTP(S) URL", { cause })
  }

  const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
  if (!isPositiveInteger(requestTimeoutMs)) {
    throw new YouCamApiError("YouCam request timeout must be a positive integer")
  }

  return {
    apiKey,
    baseUrl,
    fetchImpl: options.fetchImpl ?? fetch,
    requestTimeoutMs,
    signal: options.signal,
  }
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  options: Pick<ResolvedClientOptions, "fetchImpl" | "requestTimeoutMs" | "signal">,
  operation: string
) {
  const controller = new AbortController()
  let timedOut = false
  const handleAbort = () => controller.abort(options.signal?.reason)
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, options.requestTimeoutMs)

  if (options.signal?.aborted) {
    handleAbort()
  } else {
    options.signal?.addEventListener("abort", handleAbort, { once: true })
  }

  try {
    return await options.fetchImpl(input, { ...init, signal: controller.signal })
  } catch (cause) {
    if (options.signal?.aborted) {
      throw new YouCamApiError(`${operation} was cancelled`, { cause })
    }
    if (timedOut) {
      throw new YouCamApiError(`${operation} timed out after ${options.requestTimeoutMs} ms`, {
        cause,
      })
    }
    throw new YouCamApiError(`${operation} failed due to a network error`, { cause })
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener("abort", handleAbort)
  }
}

async function requestJson(
  pathname: string,
  init: RequestInit,
  clientOptions: YouCamClientOptions,
  operation: string
) {
  const options = resolveClientOptions(clientOptions)
  const response = await fetchWithTimeout(
    `${options.baseUrl}${pathname}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    },
    options,
    operation
  )
  const responseText = await response.text()
  let payload: unknown

  try {
    payload = JSON.parse(responseText)
  } catch (cause) {
    throw new YouCamApiError(`${operation} returned malformed JSON (HTTP ${response.status})`, {
      statusCode: response.status,
      cause,
    })
  }

  if (!response.ok) {
    const details = getApiErrorDetails(payload)
    throw new YouCamApiError(`${operation} failed: ${details.message}`, {
      statusCode: response.status,
      errorCode: details.code ?? undefined,
    })
  }

  if (!isRecord(payload) || typeof payload.status !== "number") {
    throw new YouCamApiError(`${operation} returned a malformed response`, {
      statusCode: response.status,
    })
  }

  if (payload.status < 200 || payload.status >= 300) {
    const details = getApiErrorDetails(payload)
    throw new YouCamApiError(`${operation} failed: ${details.message}`, {
      statusCode: payload.status,
      errorCode: details.code ?? undefined,
    })
  }

  return payload
}

export function isYouCamGarmentCategory(value: string): value is YouCamGarmentCategory {
  return YOUCAM_GARMENT_CATEGORIES.some((category) => category === value)
}

export async function requestFileUpload(
  input: RequestFileUploadInput,
  options: YouCamClientOptions = {}
) {
  if (!input.fileName.trim()) throw new YouCamApiError("Upload file name is required")
  if (!isPositiveInteger(input.fileSize)) {
    throw new YouCamApiError("Upload file size must be a positive integer")
  }

  const payload = await requestJson(
    "/s2s/v2.0/file/cloth-v3",
    {
      method: "POST",
      body: JSON.stringify({
        files: [
          {
            content_type: input.contentType,
            file_name: input.fileName,
            file_size: input.fileSize,
          },
        ],
      }),
    },
    options,
    "YouCam file-upload request"
  )

  if (!isRecord(payload.data) || !Array.isArray(payload.data.files)) {
    throw new YouCamApiError("Malformed YouCam response: missing uploaded file data")
  }

  const file = payload.data.files[0]
  if (!isRecord(file) || !Array.isArray(file.requests)) {
    throw new YouCamApiError("Malformed YouCam response: missing presigned upload request")
  }

  const uploadRequest = file.requests[0]
  if (!isRecord(uploadRequest) || uploadRequest.method !== "PUT") {
    throw new YouCamApiError("Malformed YouCam response: expected a presigned PUT request")
  }

  const result: YouCamFileUpload = {
    fileId: requireNonEmptyString(file.file_id, "file ID"),
    fileName: input.fileName,
    contentType: input.contentType,
    fileSize: input.fileSize,
    uploadUrl: requireHttpsUrl(uploadRequest.url, "presigned upload URL"),
    uploadHeaders: parseHeaders(uploadRequest.headers),
  }

  return result
}

export async function uploadBytes(
  upload: YouCamFileUpload,
  bytes: Uint8Array,
  options: Pick<YouCamClientOptions, "fetchImpl" | "requestTimeoutMs" | "signal"> = {}
) {
  if (bytes.byteLength !== upload.fileSize) {
    throw new YouCamApiError(
      `Upload byte length ${bytes.byteLength} does not match requested size ${upload.fileSize}`
    )
  }

  const requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
  if (!isPositiveInteger(requestTimeoutMs)) {
    throw new YouCamApiError("YouCam request timeout must be a positive integer")
  }

  const response = await fetchWithTimeout(
    upload.uploadUrl,
    {
      method: "PUT",
      headers: upload.uploadHeaders,
      body: Uint8Array.from(bytes).buffer,
    },
    {
      fetchImpl: options.fetchImpl ?? fetch,
      requestTimeoutMs,
      signal: options.signal,
    },
    "YouCam presigned file upload"
  )

  if (!response.ok) {
    const responseText = (await response.text()).replace(/\s+/g, " ").trim().slice(0, 300)
    const suffix = responseText ? `: ${responseText}` : ""
    throw new YouCamApiError(
      `YouCam presigned file upload failed with HTTP ${response.status}${suffix}`,
      { statusCode: response.status }
    )
  }
}

export async function createClothesTask(
  input: CreateClothesTaskInput,
  options: YouCamClientOptions = {}
) {
  if (!input.sourceFileId.trim() || !input.referenceFileId.trim()) {
    throw new YouCamApiError("Both source and reference file IDs are required")
  }
  if (!isYouCamGarmentCategory(input.garmentCategory)) {
    throw new YouCamApiError("Invalid YouCam garment category")
  }

  const payload = await requestJson(
    "/s2s/v2.0/task/cloth-v3",
    {
      method: "POST",
      body: JSON.stringify({
        src_file_id: input.sourceFileId,
        ref_file_id: input.referenceFileId,
        garment_category: input.garmentCategory,
      }),
    },
    options,
    "YouCam clothes-task creation"
  )

  if (!isRecord(payload.data)) {
    throw new YouCamApiError("Malformed YouCam response: missing task data")
  }

  return requireNonEmptyString(payload.data.task_id, "task ID")
}

export async function getClothesTaskStatus(
  taskId: string,
  options: YouCamClientOptions = {}
) {
  if (!taskId.trim()) throw new YouCamApiError("YouCam task ID is required")

  const payload = await requestJson(
    `/s2s/v2.0/task/cloth-v3/${encodeURIComponent(taskId)}`,
    { method: "GET" },
    options,
    "YouCam task-status request"
  )

  if (!isRecord(payload.data)) {
    throw new YouCamApiError("Malformed YouCam response: missing task status data")
  }

  const status = payload.data.task_status
  if (status !== "running" && status !== "success" && status !== "error") {
    throw new YouCamApiError("Malformed YouCam response: invalid task status")
  }

  if (status === "success") {
    if (!isRecord(payload.data.results)) {
      throw new YouCamApiError("Malformed YouCam response: missing task result")
    }

    const result: YouCamSuccessfulTask = {
      taskId,
      status,
      resultUrl: requireHttpsUrl(payload.data.results.url, "result URL"),
      errorCode: null,
      errorMessage: null,
    }
    return result
  }

  const error = status === "error" ? getApiErrorDetails(payload.data) : null
  const result: YouCamTaskResult = {
    taskId,
    status,
    resultUrl: null,
    errorCode: error?.code ?? null,
    errorMessage: error?.message ?? null,
  }
  return result
}

function waitForNextPoll(delayMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new YouCamApiError("YouCam task polling was cancelled"))
      return
    }

    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort)
      resolve()
    }, delayMs)
    const handleAbort = () => {
      clearTimeout(timeout)
      reject(new YouCamApiError("YouCam task polling was cancelled"))
    }

    signal?.addEventListener("abort", handleAbort, { once: true })
  })
}

export async function pollClothesTask(
  taskId: string,
  pollingOptions: PollClothesTaskOptions = {},
  clientOptions: YouCamClientOptions = {}
) {
  const intervalMs = pollingOptions.intervalMs ?? DEFAULT_POLL_INTERVAL_MS
  const timeoutMs = pollingOptions.timeoutMs ?? DEFAULT_POLL_TIMEOUT_MS
  if (!isPositiveInteger(intervalMs) || !isPositiveInteger(timeoutMs)) {
    throw new YouCamApiError("YouCam polling interval and timeout must be positive integers")
  }

  const startedAt = Date.now()
  const signal = pollingOptions.signal ?? clientOptions.signal
  while (true) {
    const elapsedBeforeRequest = Date.now() - startedAt
    const remainingBeforeRequest = timeoutMs - elapsedBeforeRequest
    if (remainingBeforeRequest <= 0) break

    const result = await getClothesTaskStatus(taskId, {
      ...clientOptions,
      requestTimeoutMs: Math.min(
        clientOptions.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
        remainingBeforeRequest
      ),
      signal,
    })
    pollingOptions.onStatus?.(result)

    if (result.status === "success") return result
    if (result.status === "error") {
      throw new YouCamApiError(
        `YouCam clothes task failed: ${result.errorMessage ?? "Unknown task error"}`,
        { errorCode: result.errorCode ?? undefined }
      )
    }

    const elapsedMs = Date.now() - startedAt
    const remainingMs = timeoutMs - elapsedMs
    if (remainingMs <= 0) break
    await waitForNextPoll(Math.min(intervalMs, remainingMs), signal)
  }

  throw new YouCamApiError(`YouCam clothes task timed out after ${timeoutMs} ms`)
}
