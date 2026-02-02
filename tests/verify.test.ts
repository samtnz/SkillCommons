import {
  generateEd25519Keypair,
  hashMarkdown,
  hashMarkdownHex,
  signHash
} from '../src/lib/crypto';
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
      publicKey
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

    const result = verifySkillVersion(markdown, badHash, signature, publicKey);

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
      keypair.publicKey
    );

    expect(result.signatureValid).toBe(false);
    expect(result.verified).toBe(false);
  });
});
