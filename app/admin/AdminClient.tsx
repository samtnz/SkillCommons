'use client';

import { useState } from 'react';

export function AdminClient({ publicKey }: { publicKey: string }) {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [auditRows, setAuditRows] = useState<
    Array<{
      createdAt: string;
      action: string;
      slug: string;
      version: string;
      contentHash: string;
      ip: string;
      userAgent: string;
    }>
  >([]);
  const [auditError, setAuditError] = useState<string | null>(null);

  async function fetchAudit() {
    setAuditError(null);
    const response = await fetch('/api/admin/audit');
    if (response.status === 401) {
      setAuditError('Not logged in');
      setAuditRows([]);
      return;
    }
    if (!response.ok) {
      setAuditError('Failed to load audit');
      return;
    }
    const json = await response.json();
    setAuditRows(json.data ?? []);
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    if (response.ok) {
      const json = await response.json().catch(() => null);
      setExpiresAt(json?.expiresAt ?? null);
      setMessage('Login successful. You can now publish.');
      await fetchAudit();
    } else {
      setMessage('Login failed');
    }
  }

  async function handleLogout(event: React.FormEvent) {
    event.preventDefault();
    await fetch('/api/admin/logout', { method: 'POST' });
    setMessage('Logged out');
    setExpiresAt(null);
    setAuditRows([]);
  }

  return (
    <>
      <section className="card">
        <h1>Admin Login</h1>
        <p className="meta">Enter the admin token to enable publishing.</p>
        <form onSubmit={handleLogin}>
        <label style={{ display: 'block', marginTop: '1rem' }}>
          Admin token
          <input
            type="password"
            name="token"
            required
            value={token}
            onChange={(event) => setToken(event.target.value)}
            style={{
              display: 'block',
              marginTop: '0.5rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              width: '100%'
            }}
          />
        </label>
        <button
          type="submit"
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
          Login
        </button>
      </form>
      <p className="meta" style={{ marginTop: '1rem' }}>
        Publisher public key: {publicKey}
      </p>
      <form onSubmit={handleLogout} style={{ marginTop: '1rem' }}>
        <button
          type="submit"
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: '#ffffff'
          }}
        >
          Logout
        </button>
      </form>
      {message && (
        <p className="meta" style={{ marginTop: '0.75rem' }}>
          {message}
        </p>
      )}
      {expiresAt && (
        <p className="meta" style={{ marginTop: '0.75rem' }}>
          Session expires at {expiresAt}
        </p>
      )}
        {expiresAt && (
          <p className="meta" style={{ marginTop: '0.75rem' }}>
            <a href="/publish">Go to publish</a>
          </p>
        )}
      </section>
      <section className="section card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Publish audit</h2>
        <button
          type="button"
          onClick={fetchAudit}
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: '#ffffff'
          }}
        >
          Refresh
        </button>
      </div>
      {auditError && <p className="meta">{auditError}</p>}
      {!auditError && auditRows.length === 0 && (
        <p className="meta">No events yet.</p>
      )}
      {auditRows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Time</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Action</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Slug</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Version</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Hash</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>IP</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>User Agent</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.map((row, idx) => (
                <tr key={`${row.createdAt}-${idx}`}>
                  <td style={{ padding: '0.5rem' }}>
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.5rem' }}>{row.action}</td>
                  <td style={{ padding: '0.5rem' }}>{row.slug}</td>
                  <td style={{ padding: '0.5rem' }}>{row.version}</td>
                  <td style={{ padding: '0.5rem', fontFamily: 'ui-monospace, SFMono-Regular' }}>
                    {row.contentHash.slice(0, 10)}…{row.contentHash.slice(-10)}
                  </td>
                  <td style={{ padding: '0.5rem' }}>{row.ip}</td>
                  <td style={{ padding: '0.5rem' }}>
                    {row.userAgent.length > 60
                      ? `${row.userAgent.slice(0, 60)}…`
                      : row.userAgent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </section>
    </>
  );
}
