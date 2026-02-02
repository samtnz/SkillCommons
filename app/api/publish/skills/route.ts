import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRequest } from '../../../../src/lib/auth';
import { prisma } from '../../../../src/lib/db';
import { ensurePublisherKeypair } from '../../../../src/lib/publisherKey';
import { applyRateLimitHeaders, checkRateLimit } from '../../../../src/lib/rateLimit';
import { getClientIp, getUserAgent } from '../../../../src/lib/requestMeta';
import {
  capabilitiesSchema,
  markdownSchema,
  slugSchema,
  tagsSchema,
  versionSchema
} from '../../../../src/lib/validation';
import { hashMarkdown } from '../../../../src/lib/crypto';
import { signHash } from '../../../../src/lib/crypto';
import { verifySkillVersion } from '../../../../src/lib/verify';

export const runtime = 'nodejs';

const bodySchema = z.object({
  slug: slugSchema,
  title: z.string().min(3).max(120),
  description: z.string().min(3).max(280),
  tags: tagsSchema,
  capabilities: capabilitiesSchema,
  authorDisplayName: z.string().min(2).max(80),
  version: versionSchema,
  markdown: markdownSchema
});

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const limit = 60;
  const rate = checkRateLimit(`publish-skill:${ip}`, limit, 60 * 1000);
  if (!rate.allowed) {
    const response = NextResponse.json(
      { error: 'rate_limited', reset: Math.ceil(rate.resetAt / 1000) },
      { status: 429 }
    );
    applyRateLimitHeaders(response.headers, limit, rate);
    return response;
  }

  const payload = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { slug, title, description, tags, capabilities, authorDisplayName, version, markdown } =
    parsed.data;

  const existing = await prisma.skill.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
  }

  const { privateKey, publicKey } = ensurePublisherKeypair();
  const hashBytes = hashMarkdown(markdown);
  const contentHash = hashBytes.toString('hex');
  const signature = signHash(hashBytes, privateKey);
  const verification = verifySkillVersion(markdown, contentHash, signature, publicKey, [
    publicKey
  ]);

  const created = await prisma.$transaction(async (tx) => {
    const skill = await tx.skill.create({
      data: {
        slug,
        title,
        description,
        tags,
        capabilities,
        authorDisplayName
      }
    });

    const skillVersion = await tx.skillVersion.create({
      data: {
        skillId: skill.id,
        version,
        contentMarkdown: markdown,
        contentHash,
        signature,
        publicKey
      }
    });

    await tx.publishEvent.create({
      data: {
        action: 'create_skill',
        slug,
        version,
        contentHash,
        actor: 'admin',
        ip,
        userAgent: getUserAgent(request)
      }
    });

    return { skill, skillVersion };
  });

  const response = NextResponse.json({
    data: {
      skill: {
        id: created.skill.id,
        slug: created.skill.slug,
        title: created.skill.title,
        description: created.skill.description,
        tags: created.skill.tags,
        capabilities: created.skill.capabilities,
        authorDisplayName: created.skill.authorDisplayName,
        createdAt: created.skill.createdAt.toISOString()
      },
      version: {
        version: created.skillVersion.version,
        publishedAt: created.skillVersion.publishedAt.toISOString(),
        contentHash,
        signature,
        publicKey,
        provenance: {
          signed: true,
          hashValid: verification.hashValid,
          signatureValid: verification.signatureValid,
          publicKey
        },
        verification
      }
    }
  });
  applyRateLimitHeaders(response.headers, limit, rate);
  return response;
}
