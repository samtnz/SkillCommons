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
export ADMIN_TOKEN=changeme
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
```

One-liner for a fresh local dev DB:

```bash
npm run dev:db
```

Reset database (drop/recreate, migrate, seed):

```bash
npm run db:reset
```

Visit http://localhost:3000

## Publishing (admin only)
- Set `ADMIN_TOKEN` to enable the publisher UI and API.
- The server stores its Ed25519 publisher key at `config/publisher.key` (or `PUBLISHER_KEY_PATH`).
- On first run, the key is generated automatically with file permissions set to 600.
- Admin sessions use httpOnly cookies with an 8-hour TTL; tokens are never stored client-side.
- Login and publish endpoints are rate-limited in memory.

Login at http://localhost:3000/admin, then publish at http://localhost:3000/publish.

## Tests

```bash
npm test
```

API tests require `DATABASE_URL` and seeded data.

## Registry operator policy

Edit `config/registry.json` to locally control what the registry shows. Policy is applied on read paths only.

See `docs/operator.md` for full policy semantics and deployment notes.

## Repo layout
- `app/` Next.js App Router UI + API routes
- `src/lib/` data access + crypto + verification helpers
- `prisma/` schema, migrations, seed script
- `docs/spec.md` API and hashing/signing spec
