import { and, desc, eq } from "drizzle-orm"
import { getDatabase } from "@/lib/db"
import { tryOns, type TryOnRow } from "@/lib/db/schema"
import { reconstructMockTryOn } from "@/lib/server/mock-try-on-engine"
import type { TryOn } from "@/lib/types"

function toTryOn(row: TryOnRow): TryOn {
  return {
    id: row.id,
    userId: row.userId,
    challengeId: row.challengeId,
    garmentId: row.garmentId,
    sourceImageUrl: row.sourceImageUrl,
    sourceUploadId: row.sourceUploadId,
    resultImageUrl: row.resultImageUrl,
    resultStoragePath: row.resultStoragePath,
    providerResultUrl: row.providerResultUrl,
    status: row.status,
    provider: row.provider,
    providerTaskId: row.providerTaskId,
    errorMessage: row.errorMessage,
    decision: row.decision,
    verdict: row.verdict,
    createdAt: row.createdAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  }
}

export interface ClaimTryOnRequestResult {
  tryOn: TryOn
  created: boolean
}

export async function claimTryOnRequest(
  requestId: string,
  tryOn: TryOn
): Promise<ClaimTryOnRequestResult> {
  const database = getDatabase()
  const now = new Date()

  return database.transaction(async (transaction) => {
    const [inserted] = await transaction
      .insert(tryOns)
      .values({
        id: tryOn.id,
        requestId,
        userId: tryOn.userId,
        challengeId: tryOn.challengeId,
        garmentId: tryOn.garmentId,
        sourceImageUrl: tryOn.sourceImageUrl,
        sourceUploadId: tryOn.sourceUploadId,
        status: tryOn.status,
        provider: tryOn.provider,
        providerTaskId: tryOn.providerTaskId,
        resultImageUrl: tryOn.resultImageUrl,
        resultStoragePath: tryOn.resultStoragePath,
        providerResultUrl: tryOn.providerResultUrl,
        errorMessage: tryOn.errorMessage,
        verdict: tryOn.verdict,
        decision: tryOn.decision,
        startedAt: tryOn.startedAt ? new Date(tryOn.startedAt) : null,
        completedAt: tryOn.completedAt ? new Date(tryOn.completedAt) : null,
        createdAt: new Date(tryOn.createdAt),
        updatedAt: now,
      })
      .onConflictDoNothing({ target: tryOns.requestId })
      .returning()

    if (inserted) {
      return { tryOn: toTryOn(inserted), created: true }
    }

    const [existing] = await transaction
      .select()
      .from(tryOns)
      .where(eq(tryOns.requestId, requestId))
      .limit(1)
    if (!existing) {
      throw new Error("Idempotent try-on claim could not be resolved")
    }

    return { tryOn: toTryOn(existing), created: false }
  })
}

export async function findTryOn(id: string) {
  const database = getDatabase()
  const [row] = await database.select().from(tryOns).where(eq(tryOns.id, id)).limit(1)
  return row ? toTryOn(row) : null
}

export async function findTryOnByRequestId(requestId: string) {
  const [row] = await getDatabase()
    .select()
    .from(tryOns)
    .where(eq(tryOns.requestId, requestId))
    .limit(1)
  return row ? toTryOn(row) : null
}

export async function listTryOnsByUserId(userId: string) {
  const rows = await getDatabase()
    .select()
    .from(tryOns)
    .where(eq(tryOns.userId, userId))
    .orderBy(desc(tryOns.createdAt))

  return rows.map(toTryOn)
}

export async function refreshMockTryOn(id: string) {
  const current = await findTryOn(id)
  if (!current || current.status === "completed" || current.status === "failed") return current

  const generated = reconstructMockTryOn(id)
  if (!generated) return current
  if (
    generated.status === current.status &&
    generated.resultImageUrl === current.resultImageUrl
  ) {
    return current
  }

  const [updated] = await getDatabase()
    .update(tryOns)
    .set({
      status: generated.status,
      resultImageUrl: generated.resultImageUrl,
      completedAt: generated.completedAt ? new Date(generated.completedAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(tryOns.id, id))
    .returning()

  return updated ? toTryOn(updated) : null
}

export async function updateYouCamTryOnState(
  id: string,
  update: {
    status: TryOn["status"]
    resultImageUrl?: string
    resultStoragePath?: string | null
    providerResultUrl?: string | null
    providerTaskId?: string | null
    errorMessage?: string | null
    startedAt?: Date | null
    completedAt?: Date | null
  }
) {
  const [updated] = await getDatabase()
    .update(tryOns)
    .set({
      status: update.status,
      ...(update.resultImageUrl !== undefined
        ? { resultImageUrl: update.resultImageUrl }
        : {}),
      ...(update.resultStoragePath !== undefined
        ? { resultStoragePath: update.resultStoragePath }
        : {}),
      ...(update.providerResultUrl !== undefined
        ? { providerResultUrl: update.providerResultUrl }
        : {}),
      ...(update.providerTaskId !== undefined
        ? { providerTaskId: update.providerTaskId }
        : {}),
      ...(update.errorMessage !== undefined
        ? { errorMessage: update.errorMessage }
        : {}),
      ...(update.startedAt !== undefined
        ? { startedAt: update.startedAt }
        : {}),
      ...(update.completedAt !== undefined
        ? { completedAt: update.completedAt }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(tryOns.id, id))
    .returning()

  return updated ? toTryOn(updated) : null
}

export async function updateTryOnDecision(
  id: string,
  decision: "wear" | "dare",
  userId: string
) {
  const [updated] = await getDatabase()
    .update(tryOns)
    .set({ decision, updatedAt: new Date() })
    .where(and(eq(tryOns.id, id), eq(tryOns.userId, userId)))
    .returning()

  return updated ? toTryOn(updated) : null
}
