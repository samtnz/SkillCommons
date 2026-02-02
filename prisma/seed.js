import { PrismaClient } from '@prisma/client';
import { createHash, generateKeyPairSync, sign } from 'crypto';

const prisma = new PrismaClient();

function hashMarkdown(markdown) {
  return createHash('sha256').update(Buffer.from(markdown, 'utf8')).digest();
}

function createKeypair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    publicKey,
    privateKey,
    publicKeyBase64: publicKey
      .export({ type: 'spki', format: 'der' })
      .toString('base64')
  };
}

function buildVersion({ markdown, version, keypair, publishedAt }) {
  const hashBytes = hashMarkdown(markdown);
  return {
    version,
    contentMarkdown: markdown,
    contentHash: hashBytes.toString('hex'),
    signature: sign(null, hashBytes, keypair.privateKey).toString('base64'),
    publicKey: keypair.publicKeyBase64,
    publishedAt
  };
}

async function main() {
  await prisma.skillVersion.deleteMany();
  await prisma.skill.deleteMany();

  const now = Date.now();
  const moltbookKeypair = createKeypair();
  const postgresKeypair = createKeypair();
  const unsafeKeypair = createKeypair();
  const otherKeypair = createKeypair();

  await prisma.skill.create({
    data: {
      slug: 'moltbook-posting',
      title: 'Moltbook Posting Guide',
      description: 'Instructions for posting to Moltbook with clarity and tone.',
      tags: ['publishing', 'social', 'writing'],
      capabilities: ['post-formatting', 'tone-control'],
      authorDisplayName: 'Mira L.',
      versions: {
        create: [
          buildVersion({
            version: '1.0.0',
            markdown: `# Moltbook Posting\n\n## Checklist\n- Start with the outcome\n- Use short paragraphs\n- End with a clear question\n\n## Style\nAim for warm, precise language.`,
            keypair: moltbookKeypair,
            publishedAt: new Date(now - 1000 * 60 * 60 * 24 * 10)
          }),
          buildVersion({
            version: '1.1.0',
            markdown: `# Moltbook Posting\n\n## Checklist\n- Start with the outcome\n- Use short paragraphs\n- End with a clear question\n- Add a one-line summary\n\n## Style\nAim for warm, precise language. Prefer active voice.`,
            keypair: moltbookKeypair,
            publishedAt: new Date(now - 1000 * 60 * 60 * 24 * 2)
          })
        ]
      }
    }
  });

  await prisma.skill.create({
    data: {
      slug: 'postgres-backup',
      title: 'Postgres Backup Playbook',
      description: 'Steps for safe backups and restore drills for Postgres.',
      tags: ['database', 'operations'],
      capabilities: ['backup', 'restore'],
      authorDisplayName: 'Ops Guild',
      versions: {
        create: [
          buildVersion({
            version: '1.0.0',
            markdown: `# Postgres Backup\n\n## Daily\n1. Run base backup at 02:00 UTC\n2. Verify checksum\n\n## Restore Drill\n- Restore to staging every Friday`,
            keypair: postgresKeypair,
            publishedAt: new Date(now - 1000 * 60 * 60 * 24 * 5)
          })
        ]
      }
    }
  });

  const unsafeMarkdown = `# Unsafe Example\n\nThis skill has a valid hash but an invalid signature.\nDo not trust it.`;
  const unsafeHashBytes = hashMarkdown(unsafeMarkdown);
  const unsafeSignature = sign(null, unsafeHashBytes, otherKeypair.privateKey).toString(
    'base64'
  );

  await prisma.skill.create({
    data: {
      slug: 'unsafe-example',
      title: 'Unsafe Example',
      description: 'Intentionally invalid signature to prove verification logic.',
      tags: ['example', 'security'],
      capabilities: ['verification-demo'],
      authorDisplayName: 'Registry Team',
      versions: {
        create: [
          {
            version: '1.0.0',
            contentMarkdown: unsafeMarkdown,
            contentHash: unsafeHashBytes.toString('hex'),
            signature: unsafeSignature,
            publicKey: unsafeKeypair.publicKeyBase64,
            publishedAt: new Date(now - 1000 * 60 * 60 * 24)
          }
        ]
      }
    }
  });

  console.log('Seed complete:', await prisma.skill.count(), 'skills');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
