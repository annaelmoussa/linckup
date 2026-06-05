#!/bin/sh
set -e

cd /server/apps/backend

echo "Running Medusa migrations..."
pnpm medusa db:migrate

echo "Starting Medusa backend..."
pnpm dev
