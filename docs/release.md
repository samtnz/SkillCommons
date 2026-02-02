# Release Checklist

- Bump version in `package.json`.
- Ensure Prisma migrations are up to date.
- Run `npm test` with `DATABASE_URL` + `ADMIN_TOKEN` set.
- Run `npm run db:reset` and confirm `/` loads and `/api/meta` returns.
- Confirm docs pages render from `docs/*.md`.
- Confirm publish flow works and audit logs are written.
- Confirm export endpoint respects policy.
- Tag the release (`git tag vX.Y.Z`) and push.
- Optional: build and run the Docker image.
