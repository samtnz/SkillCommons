import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/db';
import { GET as getSkills } from '../app/api/skills/route';
import { GET as getSkill } from '../app/api/skills/[slug]/route';
import { GET as getVersion } from '../app/api/skills/[slug]/versions/[version]/route';

const hasDatabase = Boolean(process.env.DATABASE_URL);
const itIfDb = hasDatabase ? it : it.skip;

if (!hasDatabase) {
  console.warn('Skipping API tests because DATABASE_URL is not set.');
}

describe('API endpoints', () => {
  afterAll(async () => {
    if (hasDatabase) {
      await prisma.$disconnect();
    }
  });

  itIfDb('lists seeded skills', async () => {
    const response = await getSkills(
      new Request('http://localhost/api/skills?limit=50')
    );
    const json = await response.json();

    const slugs = json.data.map((skill: { slug: string }) => skill.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        'moltbook-posting',
        'postgres-backup',
        'unsafe-example'
      ])
    );
  });

  itIfDb('returns verification status for skill versions', async () => {
    const response = await getSkill(new Request('http://localhost/api/skills/unsafe-example'), {
      params: { slug: 'unsafe-example' }
    });
    const json = await response.json();

    expect(json.data.versions.length).toBeGreaterThan(0);
    const first = json.data.versions[0];

    expect(first.verification.verified).toBe(false);
  });

  itIfDb('returns invalid signature for the unsafe example version', async () => {
    const version = await prisma.skillVersion.findFirst({
      where: { skill: { slug: 'unsafe-example' } }
    });

    if (!version) {
      throw new Error('Expected unsafe-example seed data to exist.');
    }

    const response = await getVersion(
      new Request(
        `http://localhost/api/skills/unsafe-example/versions/${version.version}`
      ),
      { params: { slug: 'unsafe-example', version: version.version } }
    );
    const json = await response.json();

    expect(json.data.verification.signatureValid).toBe(false);
    expect(json.data.verification.hashValid).toBe(true);
    expect(json.data.verification.verified).toBe(false);
  });
});
