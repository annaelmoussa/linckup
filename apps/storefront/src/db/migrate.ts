import "dotenv/config"
import { migrate } from "drizzle-orm/node-postgres/migrator"

import { getDb, getPool } from "./client"

async function main() {
  const pool = getPool()
  await migrate(getDb(), { migrationsFolder: "drizzle" })
  await pool.end()
}

main().catch(async (error) => {
  console.error(error)
  try {
    await getPool().end()
  } finally {
    process.exit(1)
  }
})
