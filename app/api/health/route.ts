import { NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  let dbConnected = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  return NextResponse.json({
    ok: dbConnected,
    db: dbConnected,
    time: new Date().toISOString()
  });
}
