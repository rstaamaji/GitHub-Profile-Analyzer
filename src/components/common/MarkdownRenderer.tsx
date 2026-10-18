import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
}

/**
 * Lightweight, safe client-side Markdown to HTML converter.
 * Converts headings, code blocks, lists, links, blockquotes, and bold/italic text,
 * then rigorously sanitizes via DOMPurify to prevent script execution, inline event handlers,
 * or unsafe protocols.
 */
function parseMarkdownToHtml(markdown: string): string {
  // Normalize line endings
  let text = markdown.replace(/\r\n/g, '\n');

  // 1. Code blocks (```lang ... ```)
  text = text.replace(/```([\s\S]*?)```/g, (_match, code) => {
    // Escape HTML inside code blocks
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre class="bg-[#0d1117] p-4 rounded-lg my-4 overflow-x-auto border border-[#30363d] text-xs font-mono text-neutral-200"><code>${escaped}</code></pre>`;
  });

  // 2. Inline code (`code`)
  text = text.replace(/`([^`]+)`/g, (_match, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<code class="px-1.5 py-0.5 rounded bg-[#21262d] text-neutral-200 font-mono text-[11px] border border-[#30363d]">${escaped}</code>`;
  });

  // 3. Headings
  text = text.replace(/^###### (.*$)/gim, '<h6 class="text-sm font-bold text-neutral-100 mt-4 mb-2">$1</h6>');
  text = text.replace(/^##### (.*$)/gim, '<h5 class="text-sm font-bold text-neutral-100 mt-4 mb-2">$1</h5>');
  text = text.replace(/^#### (.*$)/gim, '<h4 class="text-base font-bold text-neutral-100 mt-5 mb-2">$1</h4>');
  text = text.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-neutral-100 mt-6 mb-2.5 pb-1 border-b border-[#21262d]">$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-neutral-100 mt-7 mb-3 pb-1 border-b border-[#30363d]">$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-neutral-100 mt-8 mb-4 pb-2 border-b border-[#30363d]">$1</h1>');

  // 4. Blockquotes
  text = text.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-emerald-500/60 pl-4 py-1 my-3 text-neutral-400 italic bg-[#161b22]/50">$1</blockquote>');

  // 5. Horizontal rules
  text = text.replace(/^---$/gim, '<hr class="border-[#30363d] my-6" />');

  // 6. Bold and italic
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-neutral-200">$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em class="italic text-neutral-300">$1</em>');

  // 7. Images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded my-3 border border-[#30363d]" loading="lazy" />');

  // 8. Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-2">$1</a>');

  // 9. Unordered list items (- item or * item)
  text = text.replace(/^[*+-] (.*$)/gim, '<li class="ml-5 list-disc my-1 text-neutral-300 text-sm">$1</li>');


  // 10. Paragraphs
  const lines = text.split('\n\n');
  const parsedParagraphs = lines.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<blockquote') ||
      trimmed.startsWith('<hr') ||
      trimmed.startsWith('<li')
    ) {
      return trimmed;
    }
    return `<p class="my-2.5 text-sm text-neutral-300 leading-relaxed">${trimmed}</p>`;
  });

  return parsedParagraphs.join('\n');
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Sanitize using DOMPurify with secure HTML policy
  const cleanHtml = useMemo(() => {
    const rawHtml = parseMarkdownToHtml(content);

    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'a', 'b', 'i', 'strong', 'em', 'code', 'pre',
        'ul', 'ol', 'li', 'blockquote', 'hr', 'img', 'span', 'br',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'loading'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
      ADD_ATTR: ['target', 'rel'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'style'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    });
  }, [content]);

  return (
    <div
      className="markdown-body text-sm text-neutral-200 leading-normal overflow-hidden break-words"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};
