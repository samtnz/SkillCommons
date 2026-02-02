import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { join } from 'path';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { prisma } from '../src/lib/db';
import { resetRateLimit } from '../src/lib/rateLimit';

const hasDatabase = Boolean(process.env.DATABASE_URL);
const itIfDb = hasDatabase ? it : it.skip;

if (!hasDatabase) {
  console.warn('Skipping policy tests because DATABASE_URL is not set.');
}

const fixturesDir = join(process.cwd(), 'tests', 'fixtures');

async function setPolicyFixture(filename: string) {
  process.env.REGISTRY_POLICY_PATH = join(fixturesDir, filename);
  const { resetRegistryPolicyCache } = await import('../src/lib/policy');
  resetRegistryPolicyCache();
}

function policyHashForFixture(filename: string): string {
  const raw = readFileSync(join(fixturesDir, filename));
  return createHash('sha256').update(raw).digest('hex');
}

async function importHandlers() {
  const { resetRegistryPolicyCache } = await import('../src/lib/policy');
  resetRegistryPolicyCache();
  const skillsRoute = await import('../app/api/skills/route');
  const skillRoute = await import('../app/api/skills/[slug]/route');
  const versionRoute = await import(
    '../app/api/skills/[slug]/versions/[version]/route'
  );
  const metaRoute = await import('../app/api/meta/route');
  const exportRoute = await import('../app/api/export/skills/route');

  return {
    getSkills: skillsRoute.GET,
    getSkill: skillRoute.GET,
    getVersion: versionRoute.GET,
    getMeta: metaRoute.GET,
    getExport: exportRoute.GET
  };
}

describe('policy behavior', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  afterAll(async () => {
    if (hasDatabase) {
      await prisma.$disconnect();
    }
  });

  itIfDb('hides unsigned or invalid versions when showUnsigned=false', async () => {
    resetRateLimit();
    await setPolicyFixture('policy-hide-unsigned.json');
    const { getSkills, getSkill, getVersion } = await importHandlers();

    const listResponse = await getSkills(
      new Request('http://localhost/api/skills?limit=50')
    );
    const listJson = await listResponse.json();
    const slugs = listJson.data.map((skill: { slug: string }) => skill.slug);

    expect(slugs).toEqual(
      expect.arrayContaining(['moltbook-posting', 'postgres-backup'])
    );
    expect(slugs).not.toContain('unsafe-example');

    const unsafeResponse = await getSkill(
      new Request('http://localhost/api/skills/unsafe-example'),
      { params: { slug: 'unsafe-example' } }
    );

    expect(unsafeResponse.status).toBe(404);

    const versionResponse = await getVersion(
      new Request('http://localhost/api/skills/moltbook-posting/versions/1.0.0'),
      { params: { slug: 'moltbook-posting', version: '1.0.0' } }
    );
    const versionJson = await versionResponse.json();

    expect(versionJson.data.verification.verified).toBe(true);
    expect(versionJson.data.provenance.signed).toBe(true);
  });

  itIfDb('filters skills by allowedTags', async () => {
    resetRateLimit();
    await setPolicyFixture('policy-allowedtags-moltbook.json');
    const { getSkills } = await importHandlers();

    const listResponse = await getSkills(
      new Request('http://localhost/api/skills?limit=50')
    );
    const listJson = await listResponse.json();

    const slugs = listJson.data.map((skill: { slug: string }) => skill.slug);
    expect(slugs).toEqual(['moltbook-posting']);
  });

  itIfDb('returns meta with policy hash and active fields', async () => {
    resetRateLimit();
    await setPolicyFixture('policy-allow-all.json');
    const { getMeta } = await importHandlers();

    const response = await getMeta();
    const json = await response.json();

    expect(json.policy.hash).toBe(policyHashForFixture('policy-allow-all.json'));
    expect(json.policy.active.showUnsigned).toBe(true);
    expect(json.policy.active.allowedTags).toEqual([]);
    expect(json.server.version).toBeTruthy();
    expect(() => new Date(json.time).toISOString()).not.toThrow();
  });

  itIfDb('export respects allowedTags and showUnsigned', async () => {
    resetRateLimit();
    await setPolicyFixture('policy-allowedtags-moltbook.json');
    const { getExport } = await importHandlers();

    const response = await getExport(
      new Request('http://localhost/api/export/skills?limit=50')
    );
    const json = await response.json();

    const slugs = json.data.map((skill: { slug: string }) => skill.slug);
    expect(slugs).toEqual(['moltbook-posting']);

    await setPolicyFixture('policy-hide-unsigned.json');
    const responseHidden = await getExport(
      new Request('http://localhost/api/export/skills?limit=50')
    );
    const jsonHidden = await responseHidden.json();
    const slugsHidden = jsonHidden.data.map((skill: { slug: string }) => skill.slug);

    expect(slugsHidden).not.toContain('unsafe-example');
  });
});
