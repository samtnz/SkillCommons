import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../src/lib/auth';
import { prisma } from '../../../../src/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = await prisma.publishEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return NextResponse.json({
    data: events.map((event) => ({
      id: event.id,
      createdAt: event.createdAt.toISOString(),
      action: event.action,
      slug: event.slug,
      version: event.version,
      contentHash: event.contentHash,
      actor: event.actor,
      ip: event.ip,
      userAgent: event.userAgent
    }))
  });
}
