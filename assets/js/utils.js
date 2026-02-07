/**
 * Utility functions
 */

// Simple classNames / clsx replacement
export function classNames(...args) {
    return args
        .flat()
        .filter(Boolean)
        .join(" ")
        .trim();
}

// Global params helper (since we use HashRouter logic or simple path parsing often)
// But for now we rely on React Router
