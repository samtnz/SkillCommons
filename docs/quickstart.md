# Quickstart

## Prereqs
- Node.js 20+
- Docker + Docker Compose

## Commands

```bash
npm install

docker compose up -d

export DATABASE_URL=postgres://skills:skills@localhost:5432/skills_registry
export ADMIN_TOKEN=changeme
export NEXT_PUBLIC_REPO_URL=https://github.com/samtnz/SkillCommons
export NEXT_PUBLIC_REPO_BRANCH=master

npm run db:reset
npm run dev
```

## Default URLs
- App: http://localhost:3000
- API: http://localhost:3000/api

If port 3000 is unavailable, update your environment or container port mapping.

## Login + publish
- Login: http://localhost:3000/admin
- Publish: http://localhost:3000/publish

## Policy
- Edit `config/registry.json` to change policy.
- Policy reloads on every request in development and every 60 seconds in production.

## GitHub links
- Set `NEXT_PUBLIC_REPO_URL` and `NEXT_PUBLIC_REPO_BRANCH` to enable “Edit on GitHub” links.
