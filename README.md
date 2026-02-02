# Skills Registry (v1)

A self-hostable registry for AI agent skills. A **skill** is a Markdown document that describes instructional knowledge. Skills are content-addressed with SHA-256 and signed with Ed25519 to prove provenance.

## What this is
- A searchable index of skill metadata and signed Markdown
- A read-only API for agents to query skills and versions
- A simple UI to browse skills and view verification status

## What this is not
- Not executable code or tools
- Not a blockchain or on-chain registry
- Not a safety guarantee (provenance != trustworthiness)

## Threat model (v1)
- Skills are untrusted text and must never be executed.
- Signatures prove who published a version, not whether it is safe or correct.
- The UI sanitizes Markdown and disables raw HTML.

## Hashing and signing
- `contentHash` is the SHA-256 hash of the exact UTF-8 Markdown bytes.
- Signatures are Ed25519 signatures over the raw hash bytes (not the hex string).
- Verification recomputes the hash from stored Markdown and verifies the signature against the stored `publicKey`.

## Running locally

```bash
npm install
```

Start Postgres and the app:

```bash
docker compose up --build
```

Run migrations and seed data:

```bash
export DATABASE_URL=postgres://skills:skills@localhost:5432/skills_registry
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
```

Visit http://localhost:3000

## Tests

```bash
npm test
```

API tests require `DATABASE_URL` and seeded data.

## Repo layout
- `app/` Next.js App Router UI + API routes
- `src/lib/` data access + crypto + verification helpers
- `prisma/` schema, migrations, seed script
- `docs/spec.md` API and hashing/signing spec
