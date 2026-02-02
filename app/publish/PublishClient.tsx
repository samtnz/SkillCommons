'use client';

import { useEffect, useMemo, useState } from 'react';

type SkillOption = {
  slug: string;
  title: string;
};

type PublishResult = {
  contentHash: string;
  signature: string;
  publicKey: string;
  verification: { verified: boolean; hashValid: boolean; signatureValid: boolean };
};

async function hashMarkdown(markdown: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(markdown);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function PublishClient({
  skills,
  publicKey
}: {
  skills: SkillOption[];
  publicKey: string;
}) {
  const [createForm, setCreateForm] = useState({
    slug: '',
    title: '',
    description: '',
    authorDisplayName: '',
    tags: '',
    capabilities: '',
    version: '',
    markdown: ''
  });
  const [createHash, setCreateHash] = useState('');
  const [createResult, setCreateResult] = useState<PublishResult | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [versionForm, setVersionForm] = useState({
    slug: skills[0]?.slug ?? '',
    version: '',
    markdown: ''
  });
  const [versionHash, setVersionHash] = useState('');
  const [versionResult, setVersionResult] = useState<PublishResult | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);

  useEffect(() => {
    if (!createForm.markdown) {
      setCreateHash('');
      return;
    }
    hashMarkdown(createForm.markdown).then(setCreateHash).catch(() => setCreateHash(''));
  }, [createForm.markdown]);

  useEffect(() => {
    if (!versionForm.markdown) {
      setVersionHash('');
      return;
    }
    hashMarkdown(versionForm.markdown).then(setVersionHash).catch(() => setVersionHash(''));
  }, [versionForm.markdown]);

  const createDisabled = useMemo(() => !createForm.slug || !createForm.title, [createForm]);
  const versionDisabled = useMemo(
    () => !versionForm.slug || !versionForm.version,
    [versionForm]
  );

  async function handleCreateSubmit(event: React.FormEvent) {
    event.preventDefault();
    setCreateError(null);
    setCreateResult(null);

    const response = await fetch('/api/publish/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: createForm.slug,
        title: createForm.title,
        description: createForm.description,
        authorDisplayName: createForm.authorDisplayName,
        tags: parseList(createForm.tags),
        capabilities: parseList(createForm.capabilities),
        version: createForm.version,
        markdown: createForm.markdown
      })
    });

    const json = await response.json();
    if (!response.ok) {
      setCreateError(json.error ? JSON.stringify(json.error) : 'Failed to publish');
      return;
    }

    setCreateResult(json.data.version);
  }

  async function handleVersionSubmit(event: React.FormEvent) {
    event.preventDefault();
    setVersionError(null);
    setVersionResult(null);

    const response = await fetch(`/api/publish/skills/${versionForm.slug}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: versionForm.version,
        markdown: versionForm.markdown
      })
    });

    const json = await response.json();
    if (!response.ok) {
      setVersionError(json.error ? JSON.stringify(json.error) : 'Failed to publish');
      return;
    }

    setVersionResult(json.data);
  }

  return (
    <main>
      <section className="card">
        <h1>Publish Skills</h1>
        <p className="meta">Signed with the server publisher key.</p>
        <p className="meta">Publisher public key: {publicKey}</p>
      </section>

      <section className="section card">
        <h2>Create new skill</h2>
        <form onSubmit={handleCreateSubmit}>
          <div className="grid">
            <label>
              Slug
              <input
                type="text"
                value={createForm.slug}
                onChange={(event) =>
                  setCreateForm({ ...createForm, slug: event.target.value })
                }
                style={{
                  display: 'block',
                  marginTop: '0.4rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
            </label>
            <label>
              Title
              <input
                type="text"
                value={createForm.title}
                onChange={(event) =>
                  setCreateForm({ ...createForm, title: event.target.value })
                }
                style={{
                  display: 'block',
                  marginTop: '0.4rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
            </label>
            <label>
              Description
              <input
                type="text"
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm({ ...createForm, description: event.target.value })
                }
                style={{
                  display: 'block',
                  marginTop: '0.4rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
            </label>
            <label>
              Author display name
              <input
                type="text"
                value={createForm.authorDisplayName}
                onChange={(event) =>
                  setCreateForm({
                    ...createForm,
                    authorDisplayName: event.target.value
                  })
                }
                style={{
                  display: 'block',
                  marginTop: '0.4rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
            </label>
            <label>
              Tags (comma-separated)
              <input
                type="text"
                value={createForm.tags}
                onChange={(event) =>
                  setCreateForm({ ...createForm, tags: event.target.value })
                }
                style={{
                  display: 'block',
                  marginTop: '0.4rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
            </label>
            <label>
              Capabilities (comma-separated)
              <input
                type="text"
                value={createForm.capabilities}
                onChange={(event) =>
                  setCreateForm({ ...createForm, capabilities: event.target.value })
                }
                style={{
                  display: 'block',
                  marginTop: '0.4rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
            </label>
            <label>
              Version
              <input
                type="text"
                value={createForm.version}
                onChange={(event) =>
                  setCreateForm({ ...createForm, version: event.target.value })
                }
                style={{
                  display: 'block',
                  marginTop: '0.4rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              />
            </label>
          </div>
          <label style={{ display: 'block', marginTop: '1rem' }}>
            Markdown
            <textarea
              value={createForm.markdown}
              onChange={(event) =>
                setCreateForm({ ...createForm, markdown: event.target.value })
              }
              style={{
                width: '100%',
                minHeight: '200px',
                marginTop: '0.5rem',
                padding: '0.6rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            />
          </label>
          <p className="meta">Computed hash: {createHash || 'n/a'}</p>
          {createError && <p className="meta">{createError}</p>}
          {createResult && (
            <p className="meta">
              Published. Signature: {createResult.signature} (verified:{' '}
              {String(createResult.verification.verified)})
            </p>
          )}
          <button
            type="submit"
            disabled={createDisabled}
            style={{
              marginTop: '1rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid #1d4ed8',
              background: '#1d4ed8',
              color: '#ffffff',
              fontWeight: 600
            }}
          >
            Publish skill
          </button>
        </form>
      </section>

      <section className="section card">
        <h2>Add version</h2>
        <form onSubmit={handleVersionSubmit}>
          <label>
            Skill
            <select
              value={versionForm.slug}
              onChange={(event) =>
                setVersionForm({ ...versionForm, slug: event.target.value })
              }
              style={{
                display: 'block',
                marginTop: '0.4rem',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            >
              {skills.map((skill) => (
                <option key={skill.slug} value={skill.slug}>
                  {skill.title}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'block', marginTop: '1rem' }}>
            Version
            <input
              type="text"
              value={versionForm.version}
              onChange={(event) =>
                setVersionForm({ ...versionForm, version: event.target.value })
              }
              style={{
                display: 'block',
                marginTop: '0.4rem',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            />
          </label>
          <label style={{ display: 'block', marginTop: '1rem' }}>
            Markdown
            <textarea
              value={versionForm.markdown}
              onChange={(event) =>
                setVersionForm({ ...versionForm, markdown: event.target.value })
              }
              style={{
                width: '100%',
                minHeight: '200px',
                marginTop: '0.5rem',
                padding: '0.6rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}
            />
          </label>
          <p className="meta">Computed hash: {versionHash || 'n/a'}</p>
          {versionError && <p className="meta">{versionError}</p>}
          {versionResult && (
            <p className="meta">
              Published. Signature: {versionResult.signature} (verified:{' '}
              {String(versionResult.verification.verified)})
            </p>
          )}
          <button
            type="submit"
            disabled={versionDisabled}
            style={{
              marginTop: '1rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid #1d4ed8',
              background: '#1d4ed8',
              color: '#ffffff',
              fontWeight: 600
            }}
          >
            Publish version
          </button>
        </form>
      </section>
    </main>
  );
}
