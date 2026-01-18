/**
 * MarkdownRenderer Component
 *
 * Renders markdown content with syntax-highlighted code blocks.
 * Uses ReactMarkdown for markdown parsing and Prism for code syntax highlighting.
 *
 * Features:
 * - Converts markdown to HTML
 * - Automatic syntax highlighting for code blocks with language detection
 * - Support for inline and block code
 * - Uses synthwave84 color theme for code highlighting
 * - Wraps long lines in code blocks for better readability
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.content - The markdown content to render
 * @returns {JSX.Element} Rendered markdown with syntax-highlighted code
 */
"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { synthwave84 } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      components={{
        /**
         * Custom code block renderer with syntax highlighting
         * Detects language from class name and applies syntax highlighting
         * Falls back to plain code for inline code or unknown languages
         */
        code({ node, inline, className, children, ...props }) {
          // Extract language identifier from className (e.g., "language-javascript")
          const match = /language-(\w+)/.exec(className || "");
          // Render syntax-highlighted block for detected programming languages
          return !inline && match ? (
            <SyntaxHighlighter
              style={synthwave84}
              language={match[1]}
              PreTag="div"
              wrapLines={true}
              wrapLongLines={true}
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            // Render plain code for inline snippets or undetected languages
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
