export function getRepoBlobUrl(path: string): string | null {
  const rawRepoUrl = process.env.NEXT_PUBLIC_REPO_URL || '';
  const branch = process.env.NEXT_PUBLIC_REPO_BRANCH || '';

  if (!rawRepoUrl || !branch) {
    return null;
  }

  const normalized = rawRepoUrl.replace(/\.git$/, '').replace(/\/+$/, '');
  if (!normalized.startsWith('http')) {
    return null;
  }

  return `${normalized}/blob/${branch}/${path.replace(/^\//, '')}`;
}
