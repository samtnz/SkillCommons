# Operator Guide

## Registry policy

Edit `config/registry.json` to configure local read policy. The server reloads policy on every request in development and caches it for 60 seconds in production.

Override path for testing or ops:
- Set `REGISTRY_POLICY_PATH` to point to a JSON policy file. This overrides `config/registry.json` and is used for the policy hash in `/api/meta`.

Fields:
- `blockedSlugs` (string[]): hide any skill with a matching slug.
- `blockedPublicKeys` (string[]): hide versions signed by these keys.
- `allowedTags` (string[]): only show skills whose tags intersect this list.
- `showUnsigned` (boolean, default true):
  - `true`: show all versions (subject to blocked keys/slugs).
  - `false`: hide versions with missing signature/publicKey OR failing verification.

## Deployment notes
- Set `DATABASE_URL` to your Postgres instance.
- Set `REGISTRY_NAME` to customize `/api/meta`.
- Set `ADMIN_TOKEN` to enable admin publishing.
- Keep `config/registry.json` alongside the app for local policy.

Publisher key:
- The publisher key is stored at `config/publisher.key` by default.
- Override with `PUBLISHER_KEY_PATH`.
- Back up the key file to preserve provenance continuity.
- Rotation requires updating the key file; old signatures remain valid for old versions.
- To rotate safely:
  1) Generate and deploy a new key file.
  2) Add the old public key to `PUBLISHER_PREVIOUS_PUBLIC_KEYS`.
  3) Redeploy and keep previous keys for N days.

Audit log:
- `GET /api/admin/audit` returns the last 100 publish events (admin-only).

Rate limit headers:
- Rate-limited endpoints return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.
- `X-RateLimit-Reset` is Unix epoch seconds.

## Mirroring and export
- Use `GET /api/export/skills` with `limit` and `offset` for mirroring.
- The export endpoint respects local policy and returns the same view as the UI/API.

## Backup and restore
- Backup: `pg_dump $DATABASE_URL > backup.sql`
- Restore: `psql $DATABASE_URL < backup.sql`
