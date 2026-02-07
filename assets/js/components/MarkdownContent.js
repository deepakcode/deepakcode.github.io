import { React, JSX, useEffect } from '../modules.js';

const { jsx } = JSX;

export default function MarkdownContent({ content, className }) {
    // If content is not provided, return null
    if (!content) return null;

    // Parse markdown using global marked.js (loaded in app.html)
    // We assume 'marked' is available globally
    const htmlContent = window.marked ? window.marked.parse(content) : content;

    useEffect(() => {
        if (window.renderMermaid) {
            window.renderMermaid();
        }
    }, [htmlContent]);

    return jsx("div", {
        className: className || "prose prose-slate dark:prose-invert max-w-none",
        dangerouslySetInnerHTML: { __html: htmlContent }
    });
}
