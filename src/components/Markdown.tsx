import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

function sanitizeLink(uri?: string): string | undefined {
  if (!uri) {
    return undefined;
  }

  if (uri.startsWith('#') || uri.startsWith('/') || uri.startsWith('./') || uri.startsWith('../')) {
    return uri;
  }

  try {
    const url = new URL(uri);
    if (SAFE_PROTOCOLS.has(url.protocol)) {
      return uri;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      transformLinkUri={(uri) => sanitizeLink(uri) ?? ''}
      components={{
        a({ href, children, ...props }) {
          const safeHref = sanitizeLink(href ?? '') ?? '#';
          const isExternal = safeHref.startsWith('http');
          return (
            <a
              {...props}
              href={safeHref}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
