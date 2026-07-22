import { eq } from "drizzle-orm"
import { getDatabase } from "@/lib/db"
import { sessions, tryOns, type TryOnRow } from "@/lib/db/schema"
import { reconstructMockTryOn } from "@/lib/server/mock-try-on-engine"
import type { TryOn } from "@/lib/types"

function toTryOn(row: TryOnRow): TryOn {
  return {
    id: row.id,
    sessionId: row.sessionId,
    challengeId: row.challengeId,
    garmentId: row.garmentId,
    sourceImageUrl: row.sourceImageUrl,
    sourceUploadId: row.sourceUploadId,
    resultImageUrl: row.resultImageUrl,
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

export async function insertTryOn(tryOn: TryOn) {
  const database = getDatabase()
  const now = new Date()

  await database.transaction(async (transaction) => {
    await transaction
      .insert(sessions)
      .values({ id: tryOn.sessionId, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: sessions.id,
        set: { updatedAt: now },
      })

    await transaction.insert(tryOns).values({
      id: tryOn.id,
      sessionId: tryOn.sessionId,
      challengeId: tryOn.challengeId,
      garmentId: tryOn.garmentId,
      sourceImageUrl: tryOn.sourceImageUrl,
      sourceUploadId: tryOn.sourceUploadId,
      status: tryOn.status,
      provider: tryOn.provider,
      providerTaskId: tryOn.providerTaskId,
      resultImageUrl: tryOn.resultImageUrl,
      errorMessage: tryOn.errorMessage,
      verdict: tryOn.verdict,
      decision: tryOn.decision,
      startedAt: tryOn.startedAt ? new Date(tryOn.startedAt) : null,
      completedAt: tryOn.completedAt ? new Date(tryOn.completedAt) : null,
      createdAt: new Date(tryOn.createdAt),
      updatedAt: now,
    })
  })

  return tryOn
}

export async function findTryOn(id: string) {
  const database = getDatabase()
  const [row] = await database.select().from(tryOns).where(eq(tryOns.id, id)).limit(1)
  return row ? toTryOn(row) : null
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
    errorMessage?: string | null
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
      ...(update.errorMessage !== undefined
        ? { errorMessage: update.errorMessage }
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

export async function updateTryOnDecision(id: string, decision: "wear" | "dare") {
  const [updated] = await getDatabase()
    .update(tryOns)
    .set({ decision, updatedAt: new Date() })
    .where(eq(tryOns.id, id))
    .returning()

  return updated ? toTryOn(updated) : null
}
