import { isValidElement, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

function nodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return '';
}

const CALLOUT_PATTERNS: { test: RegExp; className: string }[] = [
  { test: /^Exam trap\s*:/i, className: 'callout callout-trap' },
  { test: /^Key idea\s*:/i, className: 'callout callout-key' },
  { test: /^Note \(current docs\)\s*:/i, className: 'callout callout-note' },
];

const components: Components = {
  blockquote({ children, ...props }) {
    const text = nodeText(children).trim();
    const match = CALLOUT_PATTERNS.find((p) => p.test.test(text));
    return (
      <blockquote className={match ? match.className : 'callout'} {...props}>
        {children}
      </blockquote>
    );
  },
  table({ children, ...props }) {
    return (
      <div className="md-table-wrap">
        <table {...props}>{children}</table>
      </div>
    );
  },
  a({ children, ...props }) {
    return (
      <a {...props} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  },
};

export function Markdown({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className={`md-body prose max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

const inlineComponents: Components = {
  p({ children }) {
    return <>{children}</>;
  },
  a({ children, ...props }) {
    return (
      <a {...props} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  },
};

/** Renders short markdown (option text, bold/code only) without a wrapping block element, safe inside <label>/<span>. */
export function InlineMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={inlineComponents}>
      {children}
    </ReactMarkdown>
  );
}
