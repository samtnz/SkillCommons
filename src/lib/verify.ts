import { hashMarkdown } from './crypto';
import { verifySignature } from './crypto';

export type VerificationResult = {
  hashValid: boolean;
  signatureValid: boolean;
  verified: boolean;
};

function isHexHash(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value);
}

export function verifySkillVersion(
  markdown: string,
  contentHash: string,
  signature: string,
  publicKey: string
): VerificationResult {
  const hashBytes = hashMarkdown(markdown);
  const computedHashHex = hashBytes.toString('hex');
  const hashValid = computedHashHex === contentHash.toLowerCase();

  let signatureValid = false;
  if (isHexHash(contentHash)) {
    try {
      signatureValid = verifySignature(
        Buffer.from(contentHash, 'hex'),
        signature,
        publicKey
      );
    } catch {
      signatureValid = false;
    }
  }

  return {
    hashValid,
    signatureValid,
    verified: hashValid && signatureValid
  };
}
