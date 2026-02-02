import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export function getAdminToken(): string | undefined {
  return process.env.ADMIN_TOKEN;
}

export function isAdminRequest(request?: Request): boolean {
  const adminToken = getAdminToken();
  if (!adminToken) {
    return false;
  }

  if (request) {
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      if (token === adminToken) {
        return true;
      }
    }
  }

  try {
    const cookieStore = cookies();
    const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (cookie?.value === adminToken) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function getAdminCookieOptions() {
  return {
    name: ADMIN_COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === 'production'
  };
}
