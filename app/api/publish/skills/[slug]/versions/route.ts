import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRequest } from '../../../../../src/lib/auth';
import { prisma } from '../../../../../src/lib/db';
import { ensurePublisherKeypair } from '../../../../../src/lib/publisherKey';
import { applyRateLimitHeaders, checkRateLimit } from '../../../../../src/lib/rateLimit';
import { getClientIp, getUserAgent } from '../../../../../src/lib/requestMeta';
import { markdownSchema, versionSchema } from '../../../../../src/lib/validation';
import { hashMarkdown, signHash } from '../../../../../src/lib/crypto';
import { verifySkillVersion } from '../../../../../src/lib/verify';

export const runtime = 'nodejs';

const bodySchema = z.object({
  version: versionSchema,
  markdown: markdownSchema
});

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const limit = 60;
  const rate = checkRateLimit(`publish-version:${ip}`, limit, 60 * 1000);
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

  const skill = await prisma.skill.findUnique({ where: { slug: params.slug } });
  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  const existingVersion = await prisma.skillVersion.findFirst({
    where: { skillId: skill.id, version: parsed.data.version }
  });
  if (existingVersion) {
    return NextResponse.json({ error: 'Version already exists' }, { status: 409 });
  }

  const { privateKey, publicKey } = ensurePublisherKeypair();
  const hashBytes = hashMarkdown(parsed.data.markdown);
  const contentHash = hashBytes.toString('hex');
  const signature = signHash(hashBytes, privateKey);
  const verification = verifySkillVersion(
    parsed.data.markdown,
    contentHash,
    signature,
    publicKey,
    [publicKey]
  );

  const created = await prisma.skillVersion.create({
    data: {
      skillId: skill.id,
      version: parsed.data.version,
      contentMarkdown: parsed.data.markdown,
      contentHash,
      signature,
      publicKey
    }
  });

  await prisma.publishEvent.create({
    data: {
      action: 'add_version',
      slug: skill.slug,
      version: created.version,
      contentHash,
      actor: 'admin',
      ip,
      userAgent: getUserAgent(request)
    }
  });

  const response = NextResponse.json({
    data: {
      version: created.version,
      publishedAt: created.publishedAt.toISOString(),
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
  });
  applyRateLimitHeaders(response.headers, limit, rate);
  return response;
}
