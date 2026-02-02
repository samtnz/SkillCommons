import Link from 'next/link';
import { Markdown } from '../../../../src/components/Markdown';
import { VerificationBadge } from '../../../../src/components/VerificationBadge';
import { getSkillVersionDetail } from '../../../../src/lib/skills';

export default async function SkillVersionPage({
  params
}: {
  params: { slug: string; version: string };
}) {
  const skillVersion = await getSkillVersionDetail(params.slug, params.version);

  if (!skillVersion) {
    return (
      <main>
        <section className="card">
          <h1>Version not found</h1>
          <p className="meta">
            No version {params.version} for {params.slug}.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="card">
        <p className="meta">
          <Link href={`/skills/${params.slug}`}>Back to {params.slug}</Link>
        </p>
        <h1>
          {params.slug} · {skillVersion.version}
        </h1>
        <p className="meta">
          Published {new Date(skillVersion.publishedAt).toLocaleString()}
        </p>
        <p className="meta">Content hash: {skillVersion.contentHash}</p>
        <VerificationBadge
          hashValid={skillVersion.verification.hashValid}
          signatureValid={skillVersion.verification.signatureValid}
        />
      </section>

      <section className="section card">
        <Markdown content={skillVersion.contentMarkdown} />
      </section>

      <section className="section card">
        <h2>Signature</h2>
        <p className="meta" style={{ wordBreak: 'break-all' }}>
          Public key: {skillVersion.publicKey}
        </p>
        <p className="meta" style={{ wordBreak: 'break-all' }}>
          Signature: {skillVersion.signature}
        </p>
      </section>
    </main>
  );
}
