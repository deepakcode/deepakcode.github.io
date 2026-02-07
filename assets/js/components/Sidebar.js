import { React, JSX, useState, useEffect, classNames, useLocation, Link } from '../modules.js';

const { jsx, jsxs } = JSX;

// Simple internal ScrollArea since we removed the complex one
const ScrollArea = ({ className, children }) => jsx("div", { className: classNames("overflow-y-auto", className), children });


/**
 * Sidebar component - renders left navigation
 */
export default function Sidebar({ className, categoryData, currentCategory }) {
    // Determine nav sections from props or fallback
    const navSections = categoryData?.sections || [];

    // Safety check for useLocation
    const location = useLocation ? useLocation() : { pathname: window.location.pathname };
    const currentPath = location.pathname;

    // Helper to determine link href
    // We assume the URL structure is /:category/:page
    // But we need to know the current category string to build the link if it's not in the item
    // The previous app used hash routing. Here we use Browser routing.
    // Let's obtain category from path.
    // We prefer the explicit 'currentCategory' prop if available to ensure consistency
    // Fallback to path parsing
    const pathParts = currentPath.split('/').filter(Boolean);
    const categorySlug = currentCategory || pathParts[0] || 'system-design'; // fallback

    return jsx("aside", {
        className: classNames(
            "fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block md:w-[280px] border-r border-sidebar-border bg-sidebar",
            className
        ),
        children: jsx(ScrollArea, {
            className: "h-full py-6 pr-4 pl-6",
            children: jsx("div", {
                className: "flex flex-col gap-6",
                children: navSections.length > 0 ? navSections.map((section, sectionIndex) =>
                    jsxs(
                        "div",
                        {
                            className: "flex flex-col gap-2",
                            children: [
                                jsxs("div", {
                                    className:
                                        "flex items-center gap-2 px-2 text-sm font-semibold text-foreground/90",
                                    children: [
                                        // Icons are strings in JSON (e.g. "box"), we need a mapper if we want icons.
                                        // For now, no icon or text only.
                                        section.title,
                                    ],
                                }),
                                section.children &&
                                jsx("div", {
                                    className:
                                        "flex flex-col gap-1 border-l border-sidebar-border/50 pl-3 ml-2.5",
                                    children: section.children.map((item, itemIndex) => {
                                        // Construct href: /category/item.id
                                        // If item.href exists use it, else construct
                                        const href = item.href || `/${categorySlug}/${item.id}`;
                                        const isActive = currentPath === href || currentPath.endsWith(`/${item.id}`);

                                        return jsx(
                                            "div",
                                            {
                                                children: jsx(Link, {
                                                    to: href,
                                                    className: classNames(
                                                        "group flex h-8 items-center rounded-md px-2 text-sm font-medium transition-colors hover:text-foreground/90",
                                                        isActive
                                                            ? "bg-sidebar-accent text-primary font-semibold"
                                                            : "text-muted-foreground",
                                                    ),
                                                    children: item.title,
                                                }),
                                            },
                                            itemIndex,
                                        );
                                    }),
                                }),
                            ],
                        },
                        sectionIndex,
                    )
                ) : jsx("div", { className: "text-sm text-muted-foreground", children: "Loading navigation..." }),
            }),
        }),
    });
}
