import { prisma } from './db';
import { verifySkillVersion } from './verify';
import { getAllowedPublisherPublicKeys } from './publisherKey';
import { loadRegistryPolicy } from './policy';

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
  provenance: {
    signed: boolean;
    hashValid: boolean;
    signatureValid: boolean;
    publicKey: string;
  };
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

function hasTagOverlap(tags: string[], allowedTags?: string[]): boolean {
  if (!allowedTags || allowedTags.length === 0) {
    return true;
  }
  return tags.some((tag) => allowedTags.includes(tag));
}

function versionIsAllowed(
  version: {
    contentMarkdown: string;
    contentHash: string;
    signature: string;
    publicKey: string;
  },
  policy: ReturnType<typeof loadRegistryPolicy>
): { allowed: boolean; verification: ReturnType<typeof verifySkillVersion> } {
  const allowedKeys = getAllowedPublisherPublicKeys();
  if (
    policy.blockedPublicKeys &&
    policy.blockedPublicKeys.includes(version.publicKey)
  ) {
    return {
      allowed: false,
      verification: { hashValid: false, signatureValid: false, verified: false }
    };
  }

  const verification = verifySkillVersion(
    version.contentMarkdown,
    version.contentHash,
    version.signature,
    version.publicKey,
    allowedKeys
  );

  const hasSignature = Boolean(version.signature && version.publicKey);
  if (policy.showUnsigned === false && (!hasSignature || !verification.verified)) {
    return { allowed: false, verification };
  }

  return { allowed: true, verification };
}

export async function listSkills({
  query,
  tags = [],
  capabilities = [],
  limit,
  offset
}: ListSkillsArgs): Promise<SkillListItem[]> {
  const policy = loadRegistryPolicy();
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

  if (policy.allowedTags && policy.allowedTags.length > 0) {
    if (tags.length > 0) {
      where.AND = [
        { tags: { hasSome: tags } },
        { tags: { hasSome: policy.allowedTags } }
      ];
      delete where.tags;
    } else {
      where.tags = { hasSome: policy.allowedTags };
    }
  }

  if (policy.blockedSlugs && policy.blockedSlugs.length > 0) {
    where.slug = { notIn: policy.blockedSlugs };
  }

  const skills = await prisma.skill.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
    include: {
      versions: {
        orderBy: { publishedAt: 'desc' },
        select: {
          version: true,
          publishedAt: true,
          contentMarkdown: true,
          contentHash: true,
          signature: true,
          publicKey: true
        }
      }
    }
  });

  return skills
    .map((skill) => {
      if (!hasTagOverlap(skill.tags, policy.allowedTags)) {
        return null;
      }

      const allowedVersions = skill.versions
        .map((version) => {
          const { allowed } = versionIsAllowed(version, policy);
          if (!allowed) {
            return null;
          }
          return version;
        })
        .filter(Boolean);

      const latest = allowedVersions[0];

      if (!latest) {
        return null;
      }

      return {
        slug: skill.slug,
        title: skill.title,
        description: skill.description,
        tags: skill.tags,
        capabilities: skill.capabilities,
        latestVersion: latest.version,
        latestPublishedAt: latest.publishedAt.toISOString()
      };
    })
    .filter(Boolean) as SkillListItem[];
}

export async function getSkillDetail(slug: string): Promise<SkillDetail | null> {
  const policy = loadRegistryPolicy();
  if (policy.blockedSlugs?.includes(slug)) {
    return null;
  }

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

  if (!hasTagOverlap(skill.tags, policy.allowedTags)) {
    return null;
  }

  const versions = skill.versions
    .map((version) => {
      const { allowed, verification } = versionIsAllowed(version, policy);
      if (!allowed) {
        return null;
      }

      return {
        version: version.version,
        publishedAt: version.publishedAt.toISOString(),
        contentHash: version.contentHash,
        provenance: {
          signed: Boolean(version.signature && version.publicKey),
          hashValid: verification.hashValid,
          signatureValid: verification.signatureValid,
          publicKey: version.publicKey
        },
        verification
      };
    })
    .filter(Boolean) as SkillVersionSummary[];

  if (versions.length === 0) {
    return null;
  }

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
  const policy = loadRegistryPolicy();
  if (policy.blockedSlugs?.includes(slug)) {
    return null;
  }

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

  if (!hasTagOverlap(skill.tags, policy.allowedTags)) {
    return null;
  }

  const versions = skill.versions
    .map((version) => {
      const { allowed, verification } = versionIsAllowed(version, policy);
      if (!allowed) {
        return null;
      }

      return {
        version: version.version,
        publishedAt: version.publishedAt.toISOString(),
        contentHash: version.contentHash,
        provenance: {
          signed: Boolean(version.signature && version.publicKey),
          hashValid: verification.hashValid,
          signatureValid: verification.signatureValid,
          publicKey: version.publicKey
        },
        verification
      };
    })
    .filter(Boolean) as SkillVersionSummary[];

  return versions.length > 0 ? versions : null;
}

export async function getSkillVersionDetail(
  slug: string,
  version: string
): Promise<SkillVersionDetail | null> {
  const policy = loadRegistryPolicy();
  if (policy.blockedSlugs?.includes(slug)) {
    return null;
  }

  const versionWhere: Record<string, unknown> = {
    version,
    skill: { slug }
  };

  const skillVersion = await prisma.skillVersion.findFirst({
    where: versionWhere,
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
    skillVersion.publicKey,
    getAllowedPublisherPublicKeys()
  );

  if (
    policy.blockedPublicKeys?.includes(skillVersion.publicKey) ||
    !hasTagOverlap(skillVersion.skill.tags, policy.allowedTags)
  ) {
    return null;
  }

  const hasSignature = Boolean(skillVersion.signature && skillVersion.publicKey);
  if (policy.showUnsigned === false && (!hasSignature || !verification.verified)) {
    return null;
  }

  return {
    version: skillVersion.version,
    publishedAt: skillVersion.publishedAt.toISOString(),
    contentHash: skillVersion.contentHash,
    signature: skillVersion.signature,
    publicKey: skillVersion.publicKey,
    contentMarkdown: skillVersion.contentMarkdown,
    provenance: {
      signed: Boolean(skillVersion.signature && skillVersion.publicKey),
      hashValid: verification.hashValid,
      signatureValid: verification.signatureValid,
      publicKey: skillVersion.publicKey
    },
    verification
  };
}

export type ExportedSkill = SkillDetail & {
  versions: SkillVersionDetail[];
};

export async function exportSkills({
  limit,
  offset
}: {
  limit: number;
  offset: number;
}): Promise<ExportedSkill[]> {
  const policy = loadRegistryPolicy();
  const where: Record<string, unknown> = {};

  if (policy.allowedTags && policy.allowedTags.length > 0) {
    where.tags = { hasSome: policy.allowedTags };
  }

  if (policy.blockedSlugs && policy.blockedSlugs.length > 0) {
    where.slug = { notIn: policy.blockedSlugs };
  }

  const skills = await prisma.skill.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
    include: {
      versions: {
        orderBy: { publishedAt: 'desc' }
      }
    }
  });

  return skills
    .map((skill) => {
      if (!hasTagOverlap(skill.tags, policy.allowedTags)) {
        return null;
      }

      const versions = skill.versions
        .map((version) => {
          const { allowed, verification } = versionIsAllowed(version, policy);
          if (!allowed) {
            return null;
          }

          return {
            version: version.version,
            publishedAt: version.publishedAt.toISOString(),
            contentHash: version.contentHash,
            contentMarkdown: version.contentMarkdown,
            signature: version.signature,
            publicKey: version.publicKey,
            provenance: {
              signed: Boolean(version.signature && version.publicKey),
              hashValid: verification.hashValid,
              signatureValid: verification.signatureValid,
              publicKey: version.publicKey
            },
            verification
          };
        })
        .filter(Boolean) as SkillVersionDetail[];

      if (versions.length === 0) {
        return null;
      }

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
    })
    .filter(Boolean) as ExportedSkill[];
}
