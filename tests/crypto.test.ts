import {
  generateEd25519Keypair,
  hashMarkdown,
  hashMarkdownHex,
  signHash,
  verifySignature
} from '../src/lib/crypto';

describe('crypto utilities', () => {
  it('hashes markdown with sha256', () => {
    const hashHex = hashMarkdownHex('hello');
    expect(hashHex).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
  });

  it('signs and verifies a content hash', () => {
    const { publicKey, privateKey } = generateEd25519Keypair();
    const hashBytes = hashMarkdown('# Title\nBody');
    const signature = signHash(hashBytes, privateKey);

    expect(verifySignature(hashBytes, signature, publicKey)).toBe(true);
  });

  it('fails verification for a different hash', () => {
    const { publicKey, privateKey } = generateEd25519Keypair();
    const hashBytes = hashMarkdown('original');
    const signature = signHash(hashBytes, privateKey);
    const otherHashBytes = hashMarkdown('modified');

    expect(verifySignature(otherHashBytes, signature, publicKey)).toBe(false);
  });
});
