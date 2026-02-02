import { NextResponse } from 'next/server';
import { getAdminCookieOptions } from '../../../../src/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    ...getAdminCookieOptions(),
    value: '',
    maxAge: 0
  });
  return response;
}
