import { React, ReactDOM, JSX, HashRouter, useState, useEffect, useLocation } from './modules.js';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import Routes from './components/Routes.js';

const { jsx, jsxs } = JSX;

function App() {
    const [navRegistry, setNavRegistry] = useState(null);
    const [categoryData, setCategoryData] = useState(null);
    const [currentCategory, setCurrentCategory] = useState('system-design'); // Default fallback

    // Fetch Registry on Mount
    useEffect(() => {
        const baseUrl = window.SITE_CONFIG?.baseUrl || "";
        fetch(`${baseUrl}/navigation/nav.json`)
            .then(res => res.json())
            .then(data => {
                setNavRegistry(data);
                if (data.categories && data.categories.length > 0) {
                    // Initial category setup could happen here if needed
                }
            })
            .catch(err => console.error("Failed to load nav registry", err));
    }, []);

    // Load Category Data when Category Changes
    useEffect(() => {
        if (!navRegistry) return;

        const cat = navRegistry.categories.find(c => c.id === currentCategory);
        if (cat && cat.dataFile) {
            const baseUrl = window.SITE_CONFIG?.baseUrl || "";
            fetch(baseUrl + cat.dataFile)
                .then(res => res.json())
                .then(data => setCategoryData(data))
                .catch(err => console.error("Failed to load category data", err));
        }
    }, [currentCategory, navRegistry]);

    return jsx(HashRouter, {
        children: jsx(AppContent, {
            navRegistry,
            categoryData,
            currentCategory,
            setCurrentCategory
        })
    });
}

// Wrapper to use useLocation
function AppContent({ navRegistry, categoryData, currentCategory, setCurrentCategory }) {
    const location = useLocation();

    // Sync Category with URL
    useEffect(() => {
        if (navRegistry) {
            const pathParts = location.pathname.split('/').filter(Boolean);
            if (pathParts.length > 0) {
                const potentialCat = pathParts[0];
                const isCategory = navRegistry.categories.some(c => c.id === potentialCat);
                if (isCategory) {
                    if (currentCategory !== potentialCat) {
                        setCurrentCategory(potentialCat);
                    }
                }
            } else {
                // Root path, maybe redirect to default or keep default
            }
        }
    }, [location.pathname, navRegistry]); // Removed currentCategory dependency to avoid loop



    return jsxs("div", {
        className: "relative flex min-h-screen flex-col bg-background",
        children: [
            jsx(Header, {
                categories: navRegistry?.categories || [],
                currentCategory,
                onCategoryChange: setCurrentCategory,
                categoryData
            }),
            jsxs("div", {
                className: "flex flex-1", // Changed to flex row for sidebar
                children: [
                    // Desktop Sidebar
                    jsx(Sidebar, {
                        className: "hidden md:block",
                        categoryData,
                        currentCategory
                    }),
                    // Main Content
                    jsx("div", {
                        className: "flex-1 min-w-0", // min-w-0 to prevent flex overflow
                        children: jsx(Routes, { categoryData, navRegistry })
                    }),
                ],
            }),
        ],
    });
}

// Render the new App
const rootElement = document.getElementById("root");
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(jsx(App, {}));
}
