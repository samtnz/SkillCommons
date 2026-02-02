import Link from 'next/link';
import { listSkills } from '../src/lib/skills';
import { parseLimit, parseList, parseOffset } from '../src/lib/pagination';

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

  return (
    <main>
      <section className="card">
        <h1>Skills Registry</h1>
        <p className="meta">
          Search and browse signed skill documents. Signatures prove provenance,
          not safety.
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
              <p className="meta" style={{ marginTop: '0.75rem' }}>
                Latest: {skill.latestVersion ?? 'n/a'} ·{' '}
                {skill.latestPublishedAt
                  ? new Date(skill.latestPublishedAt).toLocaleString()
                  : 'unpublished'}
              </p>
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
  );
}
