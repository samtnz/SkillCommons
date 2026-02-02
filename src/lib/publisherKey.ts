import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { createPrivateKey, createPublicKey, generateKeyPairSync } from 'crypto';

export type PublisherKeypair = {
  privateKey: string;
  publicKey: string;
};

function getKeyPath(): string {
  return process.env.PUBLISHER_KEY_PATH || 'config/publisher.key';
}

export function ensurePublisherKeypair(): PublisherKeypair {
  const keyPath = getKeyPath();

  if (!existsSync(keyPath)) {
    const dir = dirname(keyPath);
    if (dir && dir !== '.') {
      mkdirSync(dir, { recursive: true });
    }

    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const privateKeyBase64 = privateKey
      .export({ type: 'pkcs8', format: 'der' })
      .toString('base64');

    const payload = JSON.stringify({ privateKey: privateKeyBase64 }, null, 2);
    writeFileSync(keyPath, payload, { mode: 0o600 });
    chmodSync(keyPath, 0o600);
  }

  const raw = readFileSync(keyPath, 'utf8');
  const parsed = JSON.parse(raw) as { privateKey: string };
  const privateKey = parsed.privateKey;
  const privateKeyObj = createPrivateKey({
    key: Buffer.from(privateKey, 'base64'),
    format: 'der',
    type: 'pkcs8'
  });
  const publicKey = createPublicKey(privateKeyObj)
    .export({ type: 'spki', format: 'der' })
    .toString('base64');

  return {
    privateKey,
    publicKey
  };
}

export function getPublisherPublicKey(): string {
  return ensurePublisherKeypair().publicKey;
}

export function getAllowedPublisherPublicKeys(): string[] {
  const current = getPublisherPublicKey();
  const previous = (process.env.PUBLISHER_PREVIOUS_PUBLIC_KEYS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set([current, ...previous]));
}
