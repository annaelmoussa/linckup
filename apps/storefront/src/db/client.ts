import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema"

const globalForDb = globalThis as unknown as {
  linckupPool?: Pool
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required")
  }

  if (!globalForDb.linckupPool) {
    globalForDb.linckupPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }

  return globalForDb.linckupPool
}

export function getDb() {
  return drizzle(getPool(), { schema })
}
