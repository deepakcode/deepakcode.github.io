import { React, JSX, classNames, Button, ThemeToggle, Link, useState } from '../modules.js';
import Sidebar from './Sidebar.js';

const { jsx, jsxs } = JSX;

// Icons
const MenuIcon = (props) => jsx("svg", { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsxs("g", { children: [jsx("line", { x1: "4", x2: "20", y1: "12", y2: "12" }), jsx("line", { x1: "4", x2: "20", y1: "6", y2: "6" }), jsx("line", { x1: "4", x2: "20", y1: "18", y2: "18" })] }) });
const SearchIcon = (props) => jsx("svg", { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsxs("g", { children: [jsx("circle", { cx: "11", cy: "11", r: "8" }), jsx("path", { d: "m21 21-4.3-4.3" })] }) });
const GithubIcon = (props) => jsx("svg", { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsx("path", { d: "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" }) });
const CloseIcon = (props) => jsx("svg", { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsxs("g", { children: [jsx("line", { x1: "18", x2: "6", y1: "6", y2: "18" }), jsx("line", { x1: "6", x2: "18", y1: "6", y2: "18" })] }) });

export default function Header({ categories = [], currentCategory, onCategoryChange, categoryData }) {
    const config = window.EasyInterview?.SITE_CONFIG || { name: "Easy Interview", shortName: "EI", githubUrl: "#" };
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return jsx("header", {
        className:
            "sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        children: jsxs("div", {
            className:
                "container flex h-14 items-center px-4 md:px-8 max-w-screen-2xl mx-auto",
            children: [
                // Desktop Logo
                jsxs("div", {
                    className: "mr-4 hidden md:flex",
                    children: [
                        jsx(Link, {
                            to: "/",
                            className: "mr-6 flex items-center space-x-2 font-bold text-lg tracking-tight",
                            children: jsxs(React.Fragment, {
                                children: [
                                    jsx("span", {
                                        className: "text-primary",
                                        children: config.name,
                                    }),
                                ]
                            }),
                        }),
                        jsx("nav", {
                            className: "flex items-center gap-6 text-sm font-medium",
                            children: categories.map(cat =>
                                jsx(Link, {
                                    to: `/${cat.id}/${cat.defaultPage}`, // Link to default page of category
                                    className: classNames(
                                        "transition-colors hover:text-foreground/80",
                                        currentCategory === cat.id ? "text-foreground" : "text-muted-foreground"
                                    ),
                                    onClick: () => onCategoryChange && onCategoryChange(cat.id),
                                    children: cat.title
                                }, cat.id)
                            )
                        }),
                    ],
                }),

                // Mobile Menu Trigger
                jsx(Button, {
                    variant: "ghost",
                    size: "icon",
                    className: "mr-2 md:hidden",
                    onClick: () => setMobileMenuOpen(!mobileMenuOpen),
                    children: jsxs(React.Fragment, {
                        children: [
                            jsx(MenuIcon, { className: "h-5 w-5" }),
                            jsx("span", {
                                className: "sr-only",
                                children: "Toggle Menu",
                            }),
                        ]
                    }),
                }),

                // Mobile Menu Overlay (Simple Implementation)
                mobileMenuOpen && jsx("div", {
                    className: "fixed inset-0 z-50 bg-background md:hidden p-4",
                    children: jsxs("div", {
                        className: "flex flex-col h-full",
                        children: [
                            jsxs("div", {
                                className: "flex items-center justify-between mb-8",
                                children: [
                                    jsx("span", { className: "font-bold text-lg", children: config.name }),
                                    jsx(Button, {
                                        variant: "ghost",
                                        size: "icon",
                                        onClick: () => setMobileMenuOpen(false),
                                        children: jsx(CloseIcon, { className: "h-5 w-5" })
                                    })
                                ]
                            }),
                            jsx("div", {
                                className: "flex-1 overflow-auto",
                                children: jsx(Sidebar, { categoryData, currentCategory }) // Pass data to mobile sidebar
                            })
                        ]
                    })
                }),

                // Mobile Logo (visible when menu closed)
                jsx("div", {
                    className: "flex md:hidden flex-1",
                    children: jsxs("span", {
                        className: "font-bold flex items-center gap-2 text-primary",
                        children: [
                            ` ${config.shortName}`,
                        ],
                    }),
                }),

                // Right side actions
                jsxs("div", {
                    className: "flex flex-1 items-center justify-end space-x-2",
                    children: [
                        // Search button
                        jsx("div", {
                            className: "w-full flex-1 md:w-auto md:flex-none",
                            children: jsxs(Button, {
                                variant: "outline",
                                className:
                                    "inline-flex h-9 w-full items-center justify-start rounded-md border border-input bg-background px-4 text-sm font-medium text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground sm:w-64 lg:w-80",
                                children: [
                                    jsx(SearchIcon, { className: "mr-2 h-4 w-4" }),
                                    jsx("span", { children: "Search..." }),
                                ],
                            }),
                        }),
                        // Dark mode toggle
                        jsx(ThemeToggle, {}),
                        // GitHub link
                        jsx("a", {
                            href: config.githubUrl,
                            target: "_blank",
                            rel: "noreferrer",
                            className: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 hidden sm:inline-flex",
                            children: jsxs(React.Fragment, {
                                children: [
                                    jsx(GithubIcon, { className: "h-4 w-4" }),
                                    jsx("span", { className: "sr-only", children: "GitHub" }),
                                ]
                            }),
                        }),
                    ],
                }),
            ],
        }),
    });
}
