import Link from 'next/link';
import { getSkillDetail } from '../../../src/lib/skills';
import { VerificationBadge } from '../../../src/components/VerificationBadge';

export default async function SkillPage({
  params
}: {
  params: { slug: string };
}) {
  const skill = await getSkillDetail(params.slug);

  if (!skill) {
    return (
      <main>
        <section className="card">
          <h1>Skill not found</h1>
          <p className="meta">No skill with slug {params.slug}.</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="card">
        <h1>{skill.title}</h1>
        <p>{skill.description}</p>
        <p className="meta">Author: {skill.authorDisplayName}</p>
        <div className="tags" style={{ marginTop: '0.75rem' }}>
          {skill.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Versions</h2>
        <div className="grid" style={{ marginTop: '1rem' }}>
          {skill.versions.map((version) => (
            <article key={version.version} className="card">
              <h3>
                <Link href={`/skills/${skill.slug}/${version.version}`}>
                  {version.version}
                </Link>
              </h3>
              <p className="meta">
                Published {new Date(version.publishedAt).toLocaleString()}
              </p>
              <p className="meta">Hash: {version.contentHash}</p>
              <VerificationBadge
                hashValid={version.verification.hashValid}
                signatureValid={version.verification.signatureValid}
              />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
