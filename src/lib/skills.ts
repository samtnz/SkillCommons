import { prisma } from './db';
import { verifySkillVersion } from './verify';

export type SkillListItem = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  capabilities: string[];
  latestVersion: string | null;
  latestPublishedAt: string | null;
};

export type SkillVersionSummary = {
  version: string;
  publishedAt: string;
  contentHash: string;
  verification: {
    hashValid: boolean;
    signatureValid: boolean;
    verified: boolean;
  };
};

export type SkillDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  capabilities: string[];
  authorDisplayName: string;
  createdAt: string;
  versions: SkillVersionSummary[];
};

export type SkillVersionDetail = SkillVersionSummary & {
  contentMarkdown: string;
  signature: string;
  publicKey: string;
};

export type ListSkillsArgs = {
  query?: string;
  tags?: string[];
  capabilities?: string[];
  limit: number;
  offset: number;
};

export async function listSkills({
  query,
  tags = [],
  capabilities = [],
  limit,
  offset
}: ListSkillsArgs): Promise<SkillListItem[]> {
  const where: Record<string, unknown> = {};

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      {
        versions: {
          some: {
            contentMarkdown: { contains: query, mode: 'insensitive' }
          }
        }
      }
    ];
  }

  if (tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  if (capabilities.length > 0) {
    where.capabilities = { hasSome: capabilities };
  }

  const skills = await prisma.skill.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
    include: {
      versions: {
        orderBy: { publishedAt: 'desc' },
        take: 1,
        select: { version: true, publishedAt: true }
      }
    }
  });

  return skills.map((skill) => {
    const latest = skill.versions[0];

    return {
      slug: skill.slug,
      title: skill.title,
      description: skill.description,
      tags: skill.tags,
      capabilities: skill.capabilities,
      latestVersion: latest?.version ?? null,
      latestPublishedAt: latest?.publishedAt.toISOString() ?? null
    };
  });
}

export async function getSkillDetail(slug: string): Promise<SkillDetail | null> {
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      versions: {
        orderBy: { publishedAt: 'desc' }
      }
    }
  });

  if (!skill) {
    return null;
  }

  const versions = skill.versions.map((version) => {
    const verification = verifySkillVersion(
      version.contentMarkdown,
      version.contentHash,
      version.signature,
      version.publicKey
    );

    return {
      version: version.version,
      publishedAt: version.publishedAt.toISOString(),
      contentHash: version.contentHash,
      verification
    };
  });

  return {
    id: skill.id,
    slug: skill.slug,
    title: skill.title,
    description: skill.description,
    tags: skill.tags,
    capabilities: skill.capabilities,
    authorDisplayName: skill.authorDisplayName,
    createdAt: skill.createdAt.toISOString(),
    versions
  };
}

export async function getSkillVersions(
  slug: string
): Promise<SkillVersionSummary[] | null> {
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      versions: {
        orderBy: { publishedAt: 'desc' }
      }
    }
  });

  if (!skill) {
    return null;
  }

  return skill.versions.map((version) => {
    const verification = verifySkillVersion(
      version.contentMarkdown,
      version.contentHash,
      version.signature,
      version.publicKey
    );

    return {
      version: version.version,
      publishedAt: version.publishedAt.toISOString(),
      contentHash: version.contentHash,
      verification
    };
  });
}

export async function getSkillVersionDetail(
  slug: string,
  version: string
): Promise<SkillVersionDetail | null> {
  const skillVersion = await prisma.skillVersion.findFirst({
    where: {
      version,
      skill: { slug }
    },
    include: {
      skill: true
    }
  });

  if (!skillVersion) {
    return null;
  }

  const verification = verifySkillVersion(
    skillVersion.contentMarkdown,
    skillVersion.contentHash,
    skillVersion.signature,
    skillVersion.publicKey
  );

  return {
    version: skillVersion.version,
    publishedAt: skillVersion.publishedAt.toISOString(),
    contentHash: skillVersion.contentHash,
    signature: skillVersion.signature,
    publicKey: skillVersion.publicKey,
    contentMarkdown: skillVersion.contentMarkdown,
    verification
  };
}
