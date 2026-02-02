import {
  generateEd25519Keypair,
  hashMarkdown,
  hashMarkdownHex,
  signHash
} from '../src/lib/crypto';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { verifySkillVersion } from '../src/lib/verify';

describe('verifySkillVersion', () => {
  it('marks a valid hash and signature as verified', () => {
    const { publicKey, privateKey } = generateEd25519Keypair();
    const markdown = '# Skill\nDo the thing.';
    const hashBytes = hashMarkdown(markdown);
    const signature = signHash(hashBytes, privateKey);
    const result = verifySkillVersion(
      markdown,
      hashMarkdownHex(markdown),
      signature,
      publicKey,
      [publicKey]
    );

    expect(result.verified).toBe(true);
    expect(result.hashValid).toBe(true);
    expect(result.signatureValid).toBe(true);
  });

  it('marks hash mismatch as invalid', () => {
    const { publicKey, privateKey } = generateEd25519Keypair();
    const markdown = 'hello';
    const signature = signHash(hashMarkdown(markdown), privateKey);
    const badHash = hashMarkdownHex('different');

    const result = verifySkillVersion(markdown, badHash, signature, publicKey, [publicKey]);

    expect(result.hashValid).toBe(false);
    expect(result.verified).toBe(false);
  });

  it('marks signature mismatch as invalid', () => {
    const keypair = generateEd25519Keypair();
    const otherKeypair = generateEd25519Keypair();
    const markdown = 'hello';
    const signature = signHash(hashMarkdown(markdown), otherKeypair.privateKey);

    const result = verifySkillVersion(
      markdown,
      hashMarkdownHex(markdown),
      signature,
      keypair.publicKey,
      [keypair.publicKey]
    );

    expect(result.signatureValid).toBe(false);
    expect(result.verified).toBe(false);
  });

  it('rejects signatures signed by an untrusted public key', () => {
    const keypair = generateEd25519Keypair();
    const markdown = 'trusted';
    const signature = signHash(hashMarkdown(markdown), keypair.privateKey);

    const result = verifySkillVersion(
      markdown,
      hashMarkdownHex(markdown),
      signature,
      keypair.publicKey,
      ['some-other-key']
    );

    expect(result.signatureValid).toBe(false);
    expect(result.verified).toBe(false);
  });

  it('accepts previous publisher public keys when configured', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'publisher-prev-'));
    const keyPath = join(tempDir, 'publisher.key');
    process.env.PUBLISHER_KEY_PATH = keyPath;

    const previousKeypair = generateEd25519Keypair();
    process.env.PUBLISHER_PREVIOUS_PUBLIC_KEYS = previousKeypair.publicKey;

    const { getAllowedPublisherPublicKeys } = await import('../src/lib/publisherKey');
    const allowed = getAllowedPublisherPublicKeys();

    const markdown = 'previous-key';
    const signature = signHash(hashMarkdown(markdown), previousKeypair.privateKey);
    const result = verifySkillVersion(
      markdown,
      hashMarkdownHex(markdown),
      signature,
      previousKeypair.publicKey,
      allowed
    );

    expect(result.verified).toBe(true);

    delete process.env.PUBLISHER_PREVIOUS_PUBLIC_KEYS;
    delete process.env.PUBLISHER_KEY_PATH;
    rmSync(tempDir, { recursive: true, force: true });
  });
});
