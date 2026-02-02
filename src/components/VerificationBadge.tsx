export function VerificationBadge({
  hashValid,
  signatureValid
}: {
  hashValid: boolean;
  signatureValid: boolean;
}) {
  const verified = hashValid && signatureValid;
  const label = verified ? 'Verified' : 'Unverified';
  const className = verified ? 'badge badge-success' : 'badge badge-warning';

  return (
    <span className={className} title={`Hash: ${hashValid} | Signature: ${signatureValid}`}>
      {label}
    </span>
  );
}
