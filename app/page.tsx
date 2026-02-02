import Link from 'next/link';
import { listSkills, getSkillVersions } from '../src/lib/skills';
import { parseLimit, parseList, parseOffset } from '../src/lib/pagination';
import { PolicyBadge } from '../src/components/PolicyBadge';

export default async function Home({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const query =
    typeof searchParams.query === 'string' ? searchParams.query.trim() : undefined;
  const tags =
    typeof searchParams.tags === 'string' ? parseList(searchParams.tags) : [];
  const capabilities =
    typeof searchParams.capabilities === 'string'
      ? parseList(searchParams.capabilities)
      : [];
  const limit = parseLimit(
    typeof searchParams.limit === 'string' ? searchParams.limit : null
  );
  const offset = parseOffset(
    typeof searchParams.offset === 'string' ? searchParams.offset : null
  );

  const skills = await listSkills({ query, tags, capabilities, limit, offset });
  const latestStatuses = await Promise.all(
    skills.map(async (skill) => ({
      slug: skill.slug,
      versions: await getSkillVersions(skill.slug)
    }))
  );

  const latestBySlug = new Map(
    latestStatuses.map((entry) => [entry.slug, entry.versions?.[0] ?? null])
  );

  return (
    <>
      <main>
      <section className="card">
        <h1>Skills Registry</h1>
        <p className="meta">
          A neutral, self-hostable registry for signed agent skills
          (instructional knowledge), with verifiable provenance.
        </p>
        <p className="meta" style={{ marginTop: '0.5rem' }}>
          <a href="/docs#what-is-a-skill">What is a skill?</a>
        </p>
        <form style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="search"
            name="query"
            defaultValue={query}
            placeholder="Search title or description"
            style={{
              flex: 1,
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid #1d4ed8',
              background: '#1d4ed8',
              color: '#ffffff',
              fontWeight: 600
            }}
          >
            Search
          </button>
        </form>
      </section>

      <section className="section">
        <div className="grid">
          {skills.map((skill) => (
            <article key={skill.slug} className="card">
              <h2>
                <Link href={`/skills/${skill.slug}`}>{skill.title}</Link>
              </h2>
              <p>{skill.description}</p>
              <div className="tags">
                {skill.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {latestBySlug.get(skill.slug)?.verification.verified ? (
                  <span className="badge badge-success">Verified signature</span>
                ) : (
                  <span className="badge badge-warning">Invalid or unsigned</span>
                )}
                <p className="meta" style={{ margin: 0 }}>
                  Latest: {skill.latestVersion ?? 'n/a'} ·{' '}
                  {skill.latestPublishedAt
                    ? new Date(skill.latestPublishedAt).toLocaleString()
                    : 'unpublished'}
                </p>
              </div>
            </article>
          ))}
          {skills.length === 0 && (
            <article className="card">
              <p>No skills found.</p>
            </article>
          )}
        </div>
      </section>
      </main>
      <footer style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', gap: '1rem' }}>
        <a href="/docs">Docs</a>
        <a href="/docs/operator">Operator Guide</a>
        <a href="https://github.com/example/skills-registry">GitHub</a>
        <span style={{ marginLeft: 'auto' }}>
          <PolicyBadge />
        </span>
      </div>
    </footer>
    </>
  );
}
