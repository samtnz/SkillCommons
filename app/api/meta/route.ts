import { NextResponse } from 'next/server';
import { loadRegistryPolicyMeta } from '../../../src/lib/policy';
import { getRegistryName, getServerVersion } from '../../../src/lib/meta';

export const runtime = 'nodejs';

export async function GET() {
  const { policy, hash } = loadRegistryPolicyMeta();

  return NextResponse.json({
    registry: {
      name: getRegistryName()
    },
    policy: {
      hash,
      active: {
        allowedTags: policy.allowedTags ?? [],
        blockedSlugs: policy.blockedSlugs ?? [],
        blockedPublicKeys: policy.blockedPublicKeys ?? [],
        showUnsigned: policy.showUnsigned ?? true
      }
    },
    server: {
      version: getServerVersion()
    },
    time: new Date().toISOString()
  });
}
