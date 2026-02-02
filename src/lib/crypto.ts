import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify
} from 'crypto';

export type Ed25519Keypair = {
  publicKey: string;
  privateKey: string;
};

export function hashMarkdown(markdown: string): Buffer {
  return createHash('sha256').update(Buffer.from(markdown, 'utf8')).digest();
}

export function hashMarkdownHex(markdown: string): string {
  return hashMarkdown(markdown).toString('hex');
}

export function generateEd25519Keypair(): Ed25519Keypair {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');

  return {
    publicKey: publicKey
      .export({ type: 'spki', format: 'der' })
      .toString('base64'),
    privateKey: privateKey
      .export({ type: 'pkcs8', format: 'der' })
      .toString('base64')
  };
}

export function signHash(hashBytes: Buffer, privateKeyBase64: string): string {
  const privateKey = createPrivateKey({
    key: Buffer.from(privateKeyBase64, 'base64'),
    format: 'der',
    type: 'pkcs8'
  });

  return sign(null, hashBytes, privateKey).toString('base64');
}

export function verifySignature(
  hashBytes: Buffer,
  signatureBase64: string,
  publicKeyBase64: string
): boolean {
  const publicKey = createPublicKey({
    key: Buffer.from(publicKeyBase64, 'base64'),
    format: 'der',
    type: 'spki'
  });

  return verify(null, hashBytes, publicKey, Buffer.from(signatureBase64, 'base64'));
}
