import { readFileSync } from 'fs';
import { join } from 'path';
import { Markdown } from '../../src/components/Markdown';

export default function DocsPage() {
  const filePath = join(process.cwd(), 'docs', 'spec.md');
  const content = readFileSync(filePath, 'utf8');

  return (
    <main>
      <section className="card">
        <h1>Docs</h1>
        <p className="meta">Core concepts and API overview.</p>
        <p className="meta">
          <a href="https://github.com/example/skills-registry/blob/main/docs/spec.md">
            Edit on GitHub
          </a>
        </p>
      </section>

      <section className="section card">
        <Markdown content={content} />
      </section>
    </main>
  );
}
