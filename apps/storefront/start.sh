#!/bin/sh
set -e

cd /server/apps/storefront

if [ -z "$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" ] || [ "$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" = "auto" ]; then
  echo "Resolving Medusa publishable API key..."
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="$(node <<'NODE'
const { Client } = require("pg")

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  for (let attempt = 1; attempt <= 60; attempt++) {
    const client = new Client({ connectionString: process.env.DATABASE_URL })

    try {
      await client.connect()
      const result = await client.query(
        "select token from api_key where type = 'publishable' order by created_at asc limit 1"
      )
      const token = result.rows[0]?.token

      if (token) {
        process.stdout.write(token)
        return
      }
    } catch (error) {
      if (attempt === 60) {
        throw error
      }
    } finally {
      await client.end().catch(() => undefined)
    }

    await sleep(1000)
  }

  throw new Error("No Medusa publishable API key found")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
NODE
)"
  export NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
fi

echo "Running Linckup SaaS migrations..."
pnpm db:migrate

echo "Starting Medusa storefront and Linckup SaaS..."
pnpm dev
