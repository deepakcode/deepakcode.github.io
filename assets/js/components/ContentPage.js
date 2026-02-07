import { React, JSX, useParams, useEffect, useState } from '../modules.js';
import MarkdownContent from './MarkdownContent.js';

const { jsx, jsxs } = JSX;

export default function ContentPage({ categoryData }) {
    const { category, slug } = useParams();
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!categoryData || !slug) return;

        // Find the page entry in categoryData to get the file path
        let pageEntry = null;
        if (categoryData.sections) {
            for (const section of categoryData.sections) {
                const found = section.children?.find(child => child.id === slug);
                if (found) {
                    pageEntry = found;
                    break;
                }
            }
        }

        if (pageEntry && pageEntry.page) {
            setLoading(true);
            const contentUrl = '/' + pageEntry.page.replace(/^\/+/, ''); // Ensure one leading slash
            fetch(contentUrl)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to fetch content from ${contentUrl} (${res.status})`);
                    return res.text();
                })
                .then(text => {
                    setContent(text);
                    setLoading(false);
                    setError(null);
                })
                .catch(err => {
                    setError(err.message);
                    setLoading(false);
                });
        } else if (categoryData.sections) {
            // Only report not found if we have loaded category data and still can't find it
            setError(`Page not found: ${slug}`);
        }
    }, [categoryData, slug]);

    if (loading) return jsx("div", { className: "p-8", children: "Loading content..." });
    if (error) return jsx("div", { className: "p-8 text-red-500", children: ["Error: ", error] });

    return jsx("div", {
        className: "container max-w-4xl py-6 lg:py-10 px-4 md:px-8",
        children: jsx(MarkdownContent, { content })
    });
}
