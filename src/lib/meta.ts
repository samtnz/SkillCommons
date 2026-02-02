import { readFileSync } from 'fs';
import { join } from 'path';

export function getRegistryName(): string {
  return process.env.REGISTRY_NAME || 'Skills Registry';
}

export function getServerVersion(): string {
  const gitHash = readGitCommit();
  if (gitHash) {
    return gitHash;
  }
  return readPackageVersion() ?? '0.0.0';
}

function readGitCommit(): string | null {
  try {
    const headPath = join(process.cwd(), '.git', 'HEAD');
    const head = readFileSync(headPath, 'utf8').trim();
    if (head.startsWith('ref:')) {
      const refPath = head.replace('ref:', '').trim();
      const refFile = join(process.cwd(), '.git', refPath);
      return readFileSync(refFile, 'utf8').trim();
    }
    if (head.length >= 8) {
      return head;
    }
    return null;
  } catch {
    return null;
  }
}

function readPackageVersion(): string | null {
  try {
    const pkgPath = join(process.cwd(), 'package.json');
    const raw = readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? null;
  } catch {
    return null;
  }
}
