import { index, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"

export const tryOnStatusEnum = pgEnum("try_on_status", [
  "pending",
  "processing",
  "completed",
  "failed",
])

export const tryOnDecisionEnum = pgEnum("try_on_decision", ["wear", "dare"])

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 160 }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
})

export const tryOns = pgTable(
  "try_ons",
  {
    id: text("id").primaryKey(),
    sessionId: varchar("session_id", { length: 160 })
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    challengeId: varchar("challenge_id", { length: 32 }).notNull(),
    garmentId: varchar("garment_id", { length: 32 }).notNull(),
    sourceImageUrl: text("source_image_url").default("").notNull(),
    status: tryOnStatusEnum("status").default("pending").notNull(),
    resultImageUrl: text("result_image_url").default("").notNull(),
    verdict: text("verdict").notNull(),
    decision: tryOnDecisionEnum("decision"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("try_ons_session_id_idx").on(table.sessionId),
    index("try_ons_status_idx").on(table.status),
  ]
)

export type TryOnRow = typeof tryOns.$inferSelect
