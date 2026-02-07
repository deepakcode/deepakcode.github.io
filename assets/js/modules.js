/**
 * EasyInterview Modules Helper
 * Abstracts access to global dependencies (loaded via CDN)
 */

import { classNames as cn } from './utils.js';

// Access globals loaded via script tags
const React = window.React;
const ReactDOM = window.ReactDOM;
const ReactRouterDOM = window.ReactRouterDOM;

if (!React || !ReactDOM || !ReactRouterDOM) {
    console.error("React, ReactDOM, or ReactRouterDOM not found. Ensure CDN scripts are loaded.");
}

export { React, ReactDOM };
// JSX Runtime Helper
const jsxRuntime = (type, props, key) => {
    const newProps = { ...props };
    if (key !== undefined && key !== null) {
        newProps.key = key;
    }
    return React.createElement(type, newProps);
};

export const JSX = {
    jsx: jsxRuntime,
    jsxs: jsxRuntime,
    Fragment: React ? React.Fragment : null
};

// Hooks
export const useState = React?.useState;
export const useEffect = React?.useEffect;
export const useMemo = React?.useMemo;
export const useCallback = React?.useCallback;
export const useRef = React?.useRef;

// Router
export const BrowserRouter = ReactRouterDOM?.BrowserRouter;
export const HashRouter = ReactRouterDOM?.HashRouter;
export const Routes = ReactRouterDOM?.Switch || ReactRouterDOM?.Routes; // v5 uses Switch, v6 uses Routes. CDN v5.3.4 uses Switch.
export const Route = ReactRouterDOM?.Route;
export const Link = ReactRouterDOM?.Link;
export const useLocation = ReactRouterDOM?.useLocation;
export const useParams = ReactRouterDOM?.useParams;

// Utils
export const classNames = cn;

// Components - We need to implement these or remove them if they were from vendor.js
// The vendor bundle had: Button, ScrollArea, Sheet, etc.
// We must RE-IMPLEMENT simple versions of these since we are deleting vendor.js!

export const Button = ({ className, variant = "default", size = "default", asChild, children, ...props }) => {
    // Simple button implementation
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
    const variants = {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground"
    };
    const c = cn(baseStyles, variants[variant] || variants.default, className);

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, { className: cn(c, children.props.className), ...props });
    }

    return React.createElement("button", { className: c, ...props }, children);
};

export const ThemeToggle = () => {
    // Simplified ThemeToggle
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    return React.createElement(Button, {
        variant: "ghost",
        size: "icon",
        onClick: () => setTheme(theme === "dark" ? "light" : "dark")
    }, theme === "dark" ? "🌙" : "☀️");
};

// Placeholders for complex UI components we are removing/simplifying
export const ScrollArea = ({ className, children }) => React.createElement("div", { className: cn("overflow-auto", className) }, children);
export const Sheet = ({ children }) => React.createElement(React.Fragment, {}, children);
export const SheetTrigger = ({ asChild, children }) => asChild ? children : React.createElement(React.Fragment, {}, children);
export const SheetContent = ({ children, className }) => React.createElement("div", { className: cn("fixed inset-0 z-50 bg-background p-6 shadow-lg", className), style: { display: 'none' } }, children); // Hidden by default, standard sheet needs state.
// Note: Sheet logic is complex. We will simplify Header to NOT use Sheet for now or implement a simple modal.
