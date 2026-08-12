import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as appSchema from "@/lib/db/schema"
import * as authSchema from "@/lib/db/auth-schema"

const schema = { ...appSchema, ...authSchema }

function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  return drizzle(client, { schema })
}

type Database = ReturnType<typeof createDatabase>

let database: Database | null = null

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database operations")
  }

  database ??= createDatabase(databaseUrl)
  return database
}
