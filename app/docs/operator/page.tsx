import { readFileSync } from 'fs';
import { join } from 'path';
import { Markdown } from '../../../src/components/Markdown';

export default function OperatorDocsPage() {
  const filePath = join(process.cwd(), 'docs', 'operator.md');
  const content = readFileSync(filePath, 'utf8');

  return (
    <main>
      <section className="card">
        <h1>Operator Guide</h1>
        <p className="meta">Policy, deployment, audit, and rotation notes.</p>
        <p>
          <a href="https://github.com/example/skills-registry/blob/main/docs/operator.md">
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
