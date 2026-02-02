import { NextResponse } from 'next/server';
import { getAdminCookieOptions, getAdminToken, ADMIN_SESSION_MAX_AGE_SECONDS } from '../../../../src/lib/auth';
import { applyRateLimitHeaders, checkRateLimit } from '../../../../src/lib/rateLimit';
import { getClientIp } from '../../../../src/lib/requestMeta';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = 10;
  const rate = checkRateLimit(`admin-login:${ip}`, limit, 5 * 60 * 1000);
  if (!rate.allowed) {
    const response = NextResponse.json(
      { error: 'rate_limited', reset: Math.ceil(rate.resetAt / 1000) },
      { status: 429 }
    );
    applyRateLimitHeaders(response.headers, limit, rate);
    return response;
  }

  const adminToken = getAdminToken();
  if (!adminToken) {
    return NextResponse.json({ error: 'Admin token not configured' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body || body.token !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  const response = NextResponse.json({ ok: true, expiresAt });
  applyRateLimitHeaders(response.headers, limit, rate);
  response.cookies.set({
    ...getAdminCookieOptions(),
    value: adminToken
  });
  return response;
}
