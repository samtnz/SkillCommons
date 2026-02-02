import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

function createTempKeyPath() {
  const dir = mkdtempSync(join(tmpdir(), 'publisher-key-'));
  return { dir, path: join(dir, 'publisher.key') };
}

describe('publisher key management', () => {
  afterEach(() => {
    delete process.env.PUBLISHER_KEY_PATH;
  });

  it('generates a keypair when missing and reuses it', async () => {
    const { dir, path } = createTempKeyPath();
    process.env.PUBLISHER_KEY_PATH = path;

    const { ensurePublisherKeypair } = await import('../src/lib/publisherKey');
    const first = ensurePublisherKeypair();
    const second = ensurePublisherKeypair();

    expect(first.privateKey).toBeTruthy();
    expect(first.publicKey).toBeTruthy();
    expect(first.publicKey).toBe(second.publicKey);

    const raw = JSON.parse(readFileSync(path, 'utf8'));
    expect(raw.privateKey).toBe(first.privateKey);

    if (process.platform !== 'win32') {
      const mode = statSync(path).mode & 0o777;
      expect(mode).toBe(0o600);
    }

    rmSync(dir, { recursive: true, force: true });
  });

  it('includes previous public keys when configured', async () => {
    const { dir, path } = createTempKeyPath();
    process.env.PUBLISHER_KEY_PATH = path;
    process.env.PUBLISHER_PREVIOUS_PUBLIC_KEYS = 'prev1,prev2';

    const { getAllowedPublisherPublicKeys } = await import('../src/lib/publisherKey');
    const allowed = getAllowedPublisherPublicKeys();

    expect(allowed).toEqual(expect.arrayContaining(['prev1', 'prev2']));

    rmSync(dir, { recursive: true, force: true });
    delete process.env.PUBLISHER_PREVIOUS_PUBLIC_KEYS;
  });
});
