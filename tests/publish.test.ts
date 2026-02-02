import { afterAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { prisma } from '../src/lib/db';
import { resetRateLimit } from '../src/lib/rateLimit';

const hasDatabase = Boolean(process.env.DATABASE_URL);
const hasAdmin = Boolean(process.env.ADMIN_TOKEN);
const itIfReady = hasDatabase && hasAdmin ? it : it.skip;

if (!hasDatabase || !hasAdmin) {
  console.warn('Skipping publish tests because DATABASE_URL or ADMIN_TOKEN is not set.');
}

function makeTempKeyPath() {
  const dir = mkdtempSync(join(tmpdir(), 'publisher-key-'));
  return { dir, path: join(dir, 'publisher.key') };
}

async function importHandlers() {
  const publishSkillRoute = await import('../app/api/publish/skills/route');
  const publishVersionRoute = await import(
    '../app/api/publish/skills/[slug]/versions/route'
  );
  const getSkillRoute = await import('../app/api/skills/[slug]/route');

  return {
    publishSkill: publishSkillRoute.POST,
    publishVersion: publishVersionRoute.POST,
    getSkill: getSkillRoute.GET
  };
}

describe('publish endpoints', () => {
  afterAll(async () => {
    if (hasDatabase) {
      await prisma.$disconnect();
    }
  });

  itIfReady('rejects unauthorized publish', async () => {
    resetRateLimit();
    const { publishSkill } = await importHandlers();
    const response = await publishSkill(
      new Request('http://localhost/api/publish/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
    );

    expect(response.status).toBe(401);
  });

  itIfReady('publishes a skill and new version', async () => {
    resetRateLimit();
    const { dir, path } = makeTempKeyPath();
    process.env.PUBLISHER_KEY_PATH = path;

    const { publishSkill, publishVersion, getSkill } = await importHandlers();

    const slug = `test-skill-${Date.now()}`;
    const token = process.env.ADMIN_TOKEN as string;

    const createResponse = await publishSkill(
      new Request('http://localhost/api/publish/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          slug,
          title: 'Test Skill',
          description: 'Testing publish',
          tags: ['test'],
          capabilities: ['publish'],
          authorDisplayName: 'Test Operator',
          version: '1.0.0',
          markdown: '# Test Skill\n\nInitial version.'
        })
      })
    );

    expect(createResponse.status).toBe(200);
    const createJson = await createResponse.json();
    expect(createJson.data.version.verification.verified).toBe(true);

    const versionResponse = await publishVersion(
      new Request(`http://localhost/api/publish/skills/${slug}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          version: '1.1.0',
          markdown: '# Test Skill\n\nUpdated version.'
        })
      }),
      { params: { slug } }
    );

    expect(versionResponse.status).toBe(200);

    const readResponse = await getSkill(
      new Request(`http://localhost/api/skills/${slug}`),
      { params: { slug } }
    );
    const readJson = await readResponse.json();

    expect(readJson.data.slug).toBe(slug);
    expect(readJson.data.versions.length).toBeGreaterThanOrEqual(2);

    const auditRoute = await import('../app/api/admin/audit/route');
    const auditResponse = await auditRoute.GET(
      new Request('http://localhost/api/admin/audit', {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
    const auditJson = await auditResponse.json();
    const auditSlugs = auditJson.data.map((event: { slug: string }) => event.slug);
    expect(auditSlugs).toContain(slug);

    await prisma.skill.delete({ where: { slug } });
    await prisma.publishEvent.deleteMany({ where: { slug } });
    rmSync(dir, { recursive: true, force: true });
    delete process.env.PUBLISHER_KEY_PATH;
  });

  itIfReady('rejects unauthorized audit access', async () => {
    const auditRoute = await import('../app/api/admin/audit/route');
    const response = await auditRoute.GET(new Request('http://localhost/api/admin/audit'));
    expect(response.status).toBe(401);
  });

  itIfReady('includes rate limit headers on 429 responses', async () => {
    resetRateLimit();
    const loginRoute = await import('../app/api/admin/login/route');
    const token = process.env.ADMIN_TOKEN as string;

    let lastResponse: Response | null = null;
    for (let i = 0; i < 11; i += 1) {
      lastResponse = await loginRoute.POST(
        new Request('http://localhost/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
      );
    }

    if (!lastResponse) {
      throw new Error('Expected login responses.');
    }

    expect(lastResponse.status).toBe(429);
    expect(lastResponse.headers.get('X-RateLimit-Limit')).toBeTruthy();
    expect(lastResponse.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(lastResponse.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });
});
