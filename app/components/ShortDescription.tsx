"use client";

import DOMPurify from "dompurify";

/**
 * Renders ONYAZI / shortDescription: HTML if it contains tags, else plain text.
 */
export default function ShortDescription({ content }: { content: string }) {
  if (!content?.trim()) return null;

  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(content);

  if (looksLikeHtml) {
    const sanitized = DOMPurify.sanitize(content);
    return (
      <div
        className="mb-4 short-description"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  return <p className="mb-4">{content}</p>;
}
