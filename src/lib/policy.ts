import { readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

export type RegistryPolicy = {
  allowedTags?: string[];
  blockedSlugs?: string[];
  blockedPublicKeys?: string[];
  showUnsigned?: boolean;
};

const defaultPolicy: RegistryPolicy = {
  allowedTags: [],
  blockedSlugs: [],
  blockedPublicKeys: [],
  showUnsigned: true
};

const POLICY_TTL_MS = 60_000;

type CachedPolicy = {
  policy: RegistryPolicy;
  hash: string;
  loadedAt: number;
};

let cachedPolicy: CachedPolicy | null = null;

function hashBuffer(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function loadFromDisk(): CachedPolicy {
  const overridePath = process.env.REGISTRY_POLICY_PATH;
  const configPath = overridePath
    ? overridePath
    : join(process.cwd(), 'config', 'registry.json');

  try {
    const raw = readFileSync(configPath);
    const parsed = JSON.parse(raw.toString('utf8')) as RegistryPolicy;
    return {
      policy: {
        ...defaultPolicy,
        ...parsed
      },
      hash: hashBuffer(raw),
      loadedAt: Date.now()
    };
  } catch {
    const fallback = Buffer.from(JSON.stringify(defaultPolicy), 'utf8');
    return {
      policy: defaultPolicy,
      hash: hashBuffer(fallback),
      loadedAt: Date.now()
    };
  }
}

export function loadRegistryPolicy(): RegistryPolicy {
  const shouldReload =
    process.env.NODE_ENV === 'development' ||
    !cachedPolicy ||
    Date.now() - cachedPolicy.loadedAt > POLICY_TTL_MS;

  if (shouldReload) {
    cachedPolicy = loadFromDisk();
  }

  return cachedPolicy.policy;
}

export function loadRegistryPolicyMeta(): { policy: RegistryPolicy; hash: string } {
  loadRegistryPolicy();
  return {
    policy: cachedPolicy?.policy ?? defaultPolicy,
    hash: cachedPolicy?.hash ?? hashBuffer(Buffer.from(JSON.stringify(defaultPolicy)))
  };
}

export function resetRegistryPolicyCache() {
  cachedPolicy = null;
}
