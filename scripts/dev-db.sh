#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run dev:db" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="postgres://skills:skills@localhost:5432/skills_registry"
fi

docker compose up -d db
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run dev
