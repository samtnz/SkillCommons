# Skills Registry Spec (v1)

## Core concepts

### Skill
A skill is an instructional Markdown document (untrusted text). Skills are grouped by slug and versioned. Each version is content-addressed and signed.

#### What is a skill?
- A skill is instructional Markdown.
- Skills are not executable code.
- Skills are not tools.
- Signatures prove authorship, not safety.

Fields:
- `id` (uuid)
- `slug` (string, unique)
- `title` (string)
- `description` (string)
- `tags` (string[])
- `capabilities` (string[])
- `authorDisplayName` (string)
- `createdAt` (timestamp)

### SkillVersion
Fields:
- `id` (uuid)
- `skillId` (uuid)
- `version` (semver string)
- `contentMarkdown` (string)
- `contentHash` (sha256 hex string)
- `signature` (base64)
- `publicKey` (base64, Ed25519 public key in SPKI DER)
- `publishedAt` (timestamp)

### Endorsement (stub)
Reserved for future attestations.

## Hashing and signing rules

### Canonicalization (authoritative)
- **UTF-8 bytes:** hash the exact UTF-8 bytes of `contentMarkdown`.
- **Newlines:** do not normalize; sign the exact stored bytes (including `\\n` vs `\\r\\n`).
- **Sign input:** sign the raw 32-byte SHA-256 digest (not the hex string).

### Verification
- `contentHash` is the SHA-256 hash of the exact UTF-8 bytes of `contentMarkdown`.
- Signatures are Ed25519 signatures over the raw 32-byte hash.
- Verification checks:
  - `hashValid`: recomputed hash of `contentMarkdown` equals `contentHash`.
  - `signatureValid`: signature verifies using `publicKey` over `contentHash` bytes.
  - `verified`: `hashValid && signatureValid`.

## API

### GET /api/skills
Query params:
- `query` (string, optional)
- `tags` (comma-separated list, optional)
- `capabilities` (comma-separated list, optional)
- `limit` (default 20, max 100)
- `offset` (default 0)

Response:
```json
{
  "data": [
    {
      "slug": "moltbook-posting",
      "title": "Moltbook Posting Guide",
      "description": "Instructions for posting to Moltbook...",
      "tags": ["publishing"],
      "capabilities": ["post-formatting"],
      "latestVersion": "1.1.0",
      "latestPublishedAt": "2024-09-18T12:00:00.000Z"
    }
  ],
  "pagination": { "limit": 20, "offset": 0, "returned": 1 }
}
```

### GET /api/skills/:slug
Response:
```json
{
  "data": {
    "slug": "moltbook-posting",
    "title": "Moltbook Posting Guide",
    "description": "Instructions...",
    "tags": ["publishing"],
    "capabilities": ["post-formatting"],
    "authorDisplayName": "Mira L.",
    "createdAt": "2024-09-18T12:00:00.000Z",
    "versions": [
      {
        "version": "1.1.0",
        "publishedAt": "2024-09-18T12:00:00.000Z",
        "contentHash": "...",
        "provenance": {
          "signed": true,
          "hashValid": true,
          "signatureValid": true,
          "publicKey": "..."
        },
        "verification": {
          "hashValid": true,
          "signatureValid": true,
          "verified": true
        }
      }
    ]
  }
}
```

### GET /api/skills/:slug/versions
Response:
```json
{
  "data": [
    {
      "version": "1.1.0",
      "publishedAt": "2024-09-18T12:00:00.000Z",
      "contentHash": "...",
      "provenance": {
        "signed": true,
        "hashValid": true,
        "signatureValid": true,
        "publicKey": "..."
      },
      "verification": {
        "hashValid": true,
        "signatureValid": true,
        "verified": true
      }
    }
  ]
}
```

### GET /api/skills/:slug/versions/:version
Response:
```json
{
  "data": {
    "version": "1.1.0",
    "publishedAt": "2024-09-18T12:00:00.000Z",
    "contentMarkdown": "# Moltbook Posting...",
    "contentHash": "...",
    "signature": "...",
    "publicKey": "...",
    "provenance": {
      "signed": true,
      "hashValid": true,
      "signatureValid": true,
      "publicKey": "..."
    },
    "verification": {
      "hashValid": true,
      "signatureValid": true,
      "verified": true
    }
  }
}
```

### GET /api/meta
Response:
```json
{
  "registry": { "name": "Skills Registry" },
  "policy": {
    "hash": "...",
    "active": {
      "allowedTags": [],
      "blockedSlugs": [],
      "blockedPublicKeys": [],
      "showUnsigned": true
    }
  },
  "server": { "version": "0.1.0" },
  "time": "2024-09-18T12:00:00.000Z"
}
```

### GET /api/export/skills
Query params:
- `limit` (default 20, max 100)
- `offset` (default 0)

Response:
```json
{
  "data": [
    {
      "slug": "moltbook-posting",
      "title": "Moltbook Posting Guide",
      "description": "Instructions...",
      "tags": ["publishing"],
      "capabilities": ["post-formatting"],
      "authorDisplayName": "Mira L.",
      "createdAt": "2024-09-18T12:00:00.000Z",
      "versions": [
        {
          "version": "1.1.0",
          "publishedAt": "2024-09-18T12:00:00.000Z",
          "contentMarkdown": "# Moltbook Posting...",
          "contentHash": "...",
          "signature": "...",
          "publicKey": "...",
          "provenance": {
            "signed": true,
            "hashValid": true,
            "signatureValid": true,
            "publicKey": "..."
          },
          "verification": {
            "hashValid": true,
            "signatureValid": true,
            "verified": true
          }
        }
      ]
    }
  ],
  "pagination": { "limit": 20, "offset": 0, "returned": 1 }
}
```

## Publish API (admin-only)

Authentication:
- Header: `Authorization: Bearer <ADMIN_TOKEN>` or admin session cookie.

### POST /api/publish/skills
Body:
```json
{
  "slug": "new-skill",
  "title": "New Skill",
  "description": "Summary",
  "tags": ["example"],
  "capabilities": ["formatting"],
  "authorDisplayName": "Registry Operator",
  "version": "1.0.0",
  "markdown": "# New Skill\n\nContent"
}
```

### POST /api/publish/skills/:slug/versions
Body:
```json
{
  "version": "1.1.0",
  "markdown": "# New Skill\n\nUpdated content"
}
```

Notes:
- The server signs versions with its publisher key.
- `contentHash` is the SHA-256 hash of the exact UTF-8 Markdown bytes and is signed as raw 32-byte digest.
