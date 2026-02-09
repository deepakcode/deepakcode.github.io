import { React, ReactDOM, JSX, classNames, Button, ThemeToggle, Link, useState, useEffect, useLocation } from '../modules.js';
import Sidebar from './Sidebar.js';

const { jsx, jsxs } = JSX;

// Icons
const MenuIcon = (props) => jsx("svg", { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsxs("g", { children: [jsx("line", { x1: "4", x2: "20", y1: "12", y2: "12" }), jsx("line", { x1: "4", x2: "20", y1: "6", y2: "6" }), jsx("line", { x1: "4", x2: "20", y1: "18", y2: "18" })] }) });
const SearchIcon = (props) => jsx("svg", { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsxs("g", { children: [jsx("circle", { cx: "11", cy: "11", r: "8" }), jsx("path", { d: "m21 21-4.3-4.3" })] }) });
const GithubIcon = (props) => jsx("svg", { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsx("path", { d: "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" }) });
const CloseIcon = (props) => jsx("svg", { ...props, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsxs("g", { children: [jsx("line", { x1: "18", x2: "6", y1: "6", y2: "18" }), jsx("line", { x1: "6", x2: "18", y1: "6", y2: "18" })] }) });

export default function Header({ categories = [], currentCategory, onCategoryChange, categoryData }) {
    const config = window.EasyInterview?.SITE_CONFIG || { name: "Easy Interview", shortName: "Easy Interview", githubUrl: "#" };
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState(currentCategory);
    const [expandedSection, setExpandedSection] = useState(null);
    const [version, setVersion] = useState("v0.00");

    // Fetch version number
    useEffect(() => {
        fetch('./version.json')
            .then(res => res.json())
            .then(data => setVersion(data.version))
            .catch(err => console.error("Error fetching version:", err));
    }, []);

    // Sync expandedCategory with currentCategory when it changes from outside (e.g. desktop)
    useEffect(() => {
        if (currentCategory) {
            setExpandedCategory(currentCategory);
        }
    }, [currentCategory]);

    // Close mobile menu on path changes (actual navigation to item)
    const location = useLocation ? useLocation() : { pathname: window.location.pathname };
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    // Icons for navigation
    const ChevronDown = () => jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsx("path", { d: "m6 9 6 6 6-6" }) });
    const ChevronRight = () => jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsx("path", { d: "m9 18 6-6-6-6" }) });
    const FileText = () => jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsxs("g", { children: [jsx("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }), jsx("polyline", { points: "14 2 14 8 20 8" }), jsx("line", { x1: "16", x2: "8", y1: "13", y2: "13" }), jsx("line", { x1: "16", x2: "8", y1: "17", y2: "17" }), jsx("line", { x1: "10", x2: "8", y1: "9", y2: "9" })] }) });

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

                // Mobile Menu Overlay - Strictly Symmetrical & Indented
                mobileMenuOpen && ReactDOM.createPortal(
                    jsx("div", {
                        className: "fixed inset-0 z-[100] bg-background md:hidden flex flex-col",
                        children: jsxs("div", {
                            className: "flex flex-col h-full",
                            children: [
                                // Header - Matches Site Style
                                jsxs("div", {
                                    className: "flex items-center justify-between px-6 h-16 border-b border-border shrink-0",
                                    children: [
                                        jsx("span", {
                                            className: "font-bold text-xl tracking-tight text-primary",
                                            children: config.name
                                        }),
                                        jsx(Button, {
                                            variant: "ghost",
                                            size: "icon",
                                            className: "hover:bg-accent rounded-full",
                                            onClick: () => setMobileMenuOpen(false),
                                            children: jsx(CloseIcon, { className: "h-6 w-6" })
                                        })
                                    ]
                                }),

                                // Navigation Tree - Progressive Indentation
                                jsx("div", {
                                    className: "flex-1 overflow-y-auto pt-6 pb-32",
                                    children: jsxs("div", {
                                        className: "flex flex-col",
                                        children: [
                                            // 1. TOP-LEVEL CATEGORIES (Leftmost: 16px)
                                            categories.map(cat => {
                                                const isExposed = expandedCategory === cat.id;

                                                return jsxs("div", {
                                                    className: "flex flex-col",
                                                    children: [
                                                        jsxs("button", {
                                                            className: classNames(
                                                                "flex items-center w-full h-20 pr-4 rounded-none transition-colors text-left outline-none border-none bg-transparent cursor-pointer hover:bg-accent",
                                                                "text-[30px] font-normal leading-tight", // Absolute font parity
                                                                isExposed ? "text-primary" : "text-foreground"
                                                            ),
                                                            style: { paddingLeft: '16px' }, // Level 1
                                                            onClick: () => {
                                                                if (expandedCategory === cat.id) {
                                                                    setExpandedCategory(null);
                                                                } else {
                                                                    setExpandedCategory(cat.id);
                                                                    if (onCategoryChange) onCategoryChange(cat.id);
                                                                }
                                                                setExpandedSection(null);
                                                            },
                                                            children: [
                                                                jsx("span", { className: "flex-1", children: cat.title }),
                                                                jsx("div", {
                                                                    className: classNames("transition-transform duration-300 ml-2 opacity-30", isExposed ? "rotate-90" : ""),
                                                                    children: jsx(ChevronRight, { className: "h-3.5 w-3.5" })
                                                                })
                                                            ]
                                                        }),

                                                        // 2. SUB-CATEGORIES (+2 chars: 16px + 16px = 32px)
                                                        isExposed && jsxs("div", {
                                                            className: "flex flex-col",
                                                            children: [
                                                                currentCategory === cat.id && categoryData?.sections ?
                                                                    categoryData.sections.map((section, sIdx) => {
                                                                        const isSectionExposed = expandedSection === section.title;

                                                                        return jsxs("div", {
                                                                            className: "flex flex-col",
                                                                            children: [
                                                                                jsxs("button", {
                                                                                    className: classNames(
                                                                                        "flex items-center w-full h-20 pr-4 rounded-none text-left transition-colors outline-none border-none bg-transparent cursor-pointer hover:bg-accent",
                                                                                        "text-[30px] font-normal leading-tight", // Absolute font parity
                                                                                        isSectionExposed ? "text-primary bg-primary/5" : "text-foreground/80"
                                                                                    ),
                                                                                    style: { paddingLeft: '32px' }, // Level 2
                                                                                    onClick: () => setExpandedSection(isSectionExposed ? null : section.title),
                                                                                    children: [
                                                                                        jsx("span", { className: "flex-1", children: section.title }),
                                                                                        jsx("div", {
                                                                                            className: classNames("transition-transform duration-300 ml-2 opacity-20", isSectionExposed ? "rotate-90" : ""),
                                                                                            children: jsx(ChevronRight, { className: "h-3 w-3" })
                                                                                        })
                                                                                    ]
                                                                                }),

                                                                                // 3. ITEMS (+2 chars: 32px + 16px = 48px)
                                                                                isSectionExposed && jsxs("div", {
                                                                                    className: "flex flex-col",
                                                                                    children: [
                                                                                        section.children?.map((item, iIdx) => {
                                                                                            const itemPath = item.href || `/${cat.id}/${item.id}`;
                                                                                            const isActive = location.pathname === itemPath;

                                                                                            return jsx(Link, {
                                                                                                to: itemPath,
                                                                                                className: classNames(
                                                                                                    "flex items-center w-full min-h-[80px] pr-4 transition-colors text-left hover:bg-accent",
                                                                                                    "text-[30px] font-normal leading-tight", // Absolute font parity
                                                                                                    isActive ? "text-primary font-medium" : "text-muted-foreground/80 hover:text-primary"
                                                                                                ),
                                                                                                style: { paddingLeft: '48px' }, // Level 3
                                                                                                children: item.title
                                                                                            }, iIdx);
                                                                                        })
                                                                                    ]
                                                                                })
                                                                            ]
                                                                        }, sIdx);
                                                                    })
                                                                    : jsx("div", { className: "py-4 text-[26px] text-muted-foreground/60", style: { paddingLeft: '32px' }, children: "Loading..." })
                                                            ]
                                                        })
                                                    ]
                                                }, cat.id);
                                            })
                                        ]
                                    })
                                })
                            ]
                        })
                    }),
                    document.body
                ),

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
                        jsx("div", {
                            className: "hidden sm:flex items-center space-x-2",
                            children: [
                                jsx("span", {
                                    className: "text-[10px] font-medium text-muted-foreground opacity-50 select-none",
                                    children: version
                                }),
                                jsx("a", {
                                    href: config.githubUrl,
                                    target: "_blank",
                                    rel: "noreferrer",
                                    className: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9",
                                    children: jsxs(React.Fragment, {
                                        children: [
                                            jsx(GithubIcon, { className: "h-4 w-4" }),
                                            jsx("span", { className: "sr-only", children: "GitHub" }),
                                        ]
                                    }),
                                }),
                            ]
                        }),
                    ],
                }),
            ],
        }),
    });
}
