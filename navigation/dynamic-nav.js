/**
 * Dynamic Navigation System
 * 
 * This script intercepts the React-rendered navigation and replaces it with
 * data-driven navigation from nav.json. It loads markdown content dynamically
 * when users click navigation items.
 * 
 * Supports multiple categories via top header menu.
 * Fully data-driven: categories, menu items, and titles are read from nav.json.
 * Lazy-loads category data to improve performance.
 */

(function () {
    'use strict';

    const BASE_URL = window.SITE_CONFIG?.baseUrl || '';
    const NAV_JSON_PATH = BASE_URL + '/navigation/nav.json';
    let DEFAULT_PAGE = 'introduction';
    let DEFAULT_CATEGORY = 'system-design';

    // Global state
    let currentCategory = DEFAULT_CATEGORY;
    let navRegistry = null; // Lightweight registry from nav.json
    let categoryCache = {}; // Cache for loaded category data

    // Wait for DOM and React to render
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const el = document.querySelector(selector);
                if (el) {
                    obs.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    // Fetch navigation registry
    async function fetchNavRegistry() {
        const response = await fetch(NAV_JSON_PATH);
        if (!response.ok) {
            throw new Error(`Failed to fetch nav.json: ${response.status}`);
        }
        return response.json();
    }

    // Load category data (Lazy Loading)
    async function loadCategoryData(categoryId) {
        if (categoryCache[categoryId]) {
            return categoryCache[categoryId];
        }

        const categoryEntry = navRegistry.categories.find(c => c.id === categoryId);
        if (!categoryEntry || !categoryEntry.dataFile) {
            console.error(`No data file found for category: ${categoryId}`);
            return null;
        }

        try {
            console.log(`Loading data for category: ${categoryId}...`);
            // dataFile in nav.json likely starts with /
            const response = await fetch(BASE_URL + categoryEntry.dataFile);
            if (!response.ok) throw new Error(`Failed to fetch ${categoryEntry.dataFile}`);

            const data = await response.json();
            categoryCache[categoryId] = data;
            return data;
        } catch (error) {
            console.error(`Error loading category data for ${categoryId}:`, error);
            return null;
        }
    }

    // Fetch and parse markdown content
    async function fetchMarkdown(pagePath) {
        // pagePath usually does not start with /. so we add /
        const response = await fetch(BASE_URL + '/' + pagePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${pagePath}: ${response.status}`);
        }
        const markdown = await response.text();

        // Use marked.js if available, otherwise return raw markdown
        if (window.marked) {
            return marked.parse(markdown);
        }
        return `<pre>${markdown}</pre>`;
    }

    // Get current page from URL hash or default
    function getCurrentPageId() {
        const hash = window.location.hash.slice(1);
        if (hash.includes('/')) {
            // Format: category/pageId
            const parts = hash.split('/');
            currentCategory = parts[0];
            return parts[1];
        }
        return hash || DEFAULT_PAGE;
    }

    // Update URL hash with category and optional anchor
    function updateHash(pageId, category, anchor = '') {
        let hash = '#' + category + '/' + pageId;
        if (anchor) hash += '#' + anchor;
        history.pushState(null, '', hash);
    }

    // Find the content container
    function findContentContainer() {
        const main = document.querySelector('main');
        if (main) {
            const contentDiv = main.querySelector('.mx-auto.w-full');
            if (contentDiv) return contentDiv;
            return main;
        }
        return null;
    }

    // Helper: Find category metadata in registry
    function findCategoryMeta(categoryId) {
        if (!navRegistry || !navRegistry.categories) return null;
        return navRegistry.categories.find(c => c.id === categoryId);
    }

    // Get category title for breadcrumb
    function getCategoryTitle(category) {
        const catData = findCategoryMeta(category);
        return catData ? catData.heading : 'Documentation';
    }

    // Helper: Find next page in sequence
    function getNextPage(category, currentPageId) {
        const categoryData = categoryCache[category];
        if (!categoryData || !categoryData.sections) return null;

        let foundCurrent = false;

        for (let i = 0; i < categoryData.sections.length; i++) {
            const section = categoryData.sections[i];
            for (let j = 0; j < section.children.length; j++) {
                const child = section.children[j];

                if (foundCurrent) {
                    return child; // This is the next page
                }

                if (child.id === currentPageId) {
                    foundCurrent = true;
                }
            }
        }
        return null; // No next page found (end of list)
    }

    // Render markdown content to the content area
    async function renderContent(pageId, pagePath, category, anchor = '') {
        const contentContainer = findContentContainer();
        if (!contentContainer) {
            console.error('Content container not found');
            return;
        }

        try {
            const html = await fetchMarkdown(pagePath);

            // Find the page title - Need to ensure category data is loaded to find title
            // Optimization: If we just navigated, data should be loaded. 
            // If direct link, switchCategory will have loaded it.
            let pageTitle = pageId;
            const categoryData = categoryCache[category];

            if (categoryData && categoryData.sections) {
                for (const section of categoryData.sections) {
                    for (const child of section.children) {
                        if (child.id === pageId) {
                            pageTitle = child.title;
                            break;
                        }
                    }
                }
            }

            const nextPage = getNextPage(category, pageId);
            let footerHtml = '';

            if (nextPage) {
                footerHtml = `
        <div class="mt-12 flex items-center justify-between border-t border-border pt-6">
          <div class="flex flex-col gap-2"></div>
          <div class="flex flex-col gap-2 items-end">
            <a href="#${category}/${nextPage.id}" class="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              Next Chapter: ${nextPage.title}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-2 h-4 w-4"><path d="m9 18 6-6-6-6"></path></svg>
            </a>
          </div>
        </div>`;
            } else {
                footerHtml = `
        <div class="mt-12 flex items-center justify-between border-t border-border pt-6">
          <div class="flex flex-col gap-2"></div>
          <div class="flex flex-col gap-2 items-end">
            <span class="text-sm text-muted-foreground">End of ${getCategoryTitle(category)}</span>
          </div>
        </div>`;
            }

            // Render with the same structure as the original React app
            contentContainer.innerHTML = `
        <div class="mb-4 flex items-center space-x-1 text-sm text-muted-foreground">
          <span class="truncate">${getCategoryTitle(category)}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m9 18 6-6-6-6"></path></svg>
          <span class="font-medium text-foreground">${pageTitle}</span>
        </div>
        <div class="prose prose-slate dark:prose-invert max-w-none">
          ${html}
        </div>
        ${footerHtml}
      `;

            // Render Mermaid diagrams
            if (window.renderMermaid) {
                window.renderMermaid();
            }

            // Handle deep linking / anchor scrolling
            if (anchor) {
                setTimeout(() => {
                    const element = document.getElementById(anchor);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            } else {
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error('Error loading content:', error);
            contentContainer.innerHTML = `
        <div class="text-red-500">
          <h2>Error Loading Content</h2>
          <p>Could not load the page: ${pagePath}</p>
          <p>${error.message}</p>
        </div>
      `;
        }
    }

    // Update active state in navigation
    function updateActiveState(pageId) {
        document.querySelectorAll('[data-nav-id]').forEach(el => {
            el.classList.remove('bg-sidebar-accent', 'text-primary', 'font-semibold');
            el.classList.add('text-muted-foreground');
        });

        const activeItem = document.querySelector(`[data-nav-id="${pageId}"]`);
        if (activeItem) {
            activeItem.classList.remove('text-muted-foreground');
            activeItem.classList.add('bg-sidebar-accent', 'text-primary', 'font-semibold');
        }
    }

    // Update active state in header menu
    function updateHeaderActiveState(category) {
        document.querySelectorAll('[data-category-link]').forEach(el => {
            el.classList.remove('text-foreground');
            el.classList.add('text-muted-foreground');
        });

        const activeLink = document.querySelector(`[data-category-link="${category}"]`);
        if (activeLink) {
            activeLink.classList.remove('text-muted-foreground');
            activeLink.classList.add('text-foreground');
        }
    }

    // Build navigation from nav.json data for a specific category
    async function buildNavigation(sidebar, category) {
        const navContainer = sidebar.querySelector('.flex.flex-col.gap-6');
        if (!navContainer) {
            console.error('Navigation container not found inside sidebar');
            return;
        }

        // Ensure data is loaded
        const categoryData = await loadCategoryData(category);
        if (!categoryData) {
            console.error(`Category data not found/loaded for ${category}`);
            return;
        }

        const sections = categoryData.sections || [];

        // Clear existing navigation
        navContainer.innerHTML = '';

        // Build new navigation
        for (const section of sections) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'flex flex-col gap-2';

            // Section header
            const headerDiv = document.createElement('div');
            headerDiv.className = 'flex items-center gap-2 px-2 text-sm font-semibold text-foreground/90';

            const iconSvg = getIconSvg(section.icon);
            if (iconSvg) headerDiv.innerHTML = iconSvg;

            const titleSpan = document.createElement('span');
            titleSpan.textContent = section.title;
            headerDiv.appendChild(titleSpan);
            sectionDiv.appendChild(headerDiv);

            // Children container
            if (section.children && section.children.length > 0) {
                const childrenDiv = document.createElement('div');
                childrenDiv.className = 'flex flex-col gap-1 border-l border-sidebar-border/50 pl-3 ml-2.5';

                for (const child of section.children) {
                    const link = document.createElement('a');
                    link.href = '#' + category + '/' + child.id;
                    link.className = 'group flex h-8 items-center rounded-md px-2 text-sm font-medium transition-colors hover:text-foreground/90 text-muted-foreground';
                    link.textContent = child.title;
                    link.setAttribute('data-nav-id', child.id);
                    link.setAttribute('data-page-path', child.page);

                    link.addEventListener('click', async (e) => {
                        e.preventDefault();
                        updateHash(child.id, category);
                        updateActiveState(child.id);
                        await renderContent(child.id, child.page, category);
                    });

                    childrenDiv.appendChild(link);
                }

                sectionDiv.appendChild(childrenDiv);
            }

            navContainer.appendChild(sectionDiv);
        }
    }

    // Switch to a different category
    async function switchCategory(category) {
        currentCategory = category;
        updateHeaderActiveState(category);

        const sidebar = document.querySelector('aside');
        if (sidebar) {
            await buildNavigation(sidebar, category);
        }
    }

    // Inject header menu items
    function injectHeaderMenuItems() {
        // [MODIFIED] Disabled to prevent duplicate header (React App handles this now)
        return true;

        /* Legacy code disabled
        const headerNav = document.querySelector('header nav');
        if (!headerNav) {
            console.log('Header nav not found, will retry...');
            return false;
        }
        
        if (headerNav.querySelector('[data-category-link]')) {
            console.log('Menu items already injected');
            return true;
        }
        
        if (!navRegistry || !navRegistry.categories) return false;
        
        const menuItems = navRegistry.categories.map(cat => ({
            text: cat.title,
            category: cat.id,
            defaultPage: cat.defaultPage
        }));
        
        menuItems.forEach((item) => {
            const link = document.createElement('a');
            link.href = '#' + item.category + '/' + item.defaultPage;
            link.textContent = item.text;
            link.setAttribute('data-category-link', item.category);
            link.className = 'text-sm font-medium transition-colors hover:text-foreground/80';
        
            if (item.category === currentCategory) {
                link.classList.add('text-foreground');
            } else {
                link.classList.add('text-muted-foreground');
            }
        
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                await switchCategory(item.category);
        
                // Navigate to default page
                // We need to fetch page data to get the path (or assume defaultPage matches structure)
                // For simplicity, we assume we need to load meta first to get path? 
                // Wait, getPagePath needs loaded data. 
                // buildNavigation calls loadCategoryData, so safe to call after switchCategory
        
                const pagePath = await getPagePath(item.defaultPage, item.category);
                updateHash(item.defaultPage, item.category);
                updateActiveState(item.defaultPage);
                if (pagePath) {
                    await renderContent(item.defaultPage, pagePath, item.category);
                }
            });
        
            headerNav.appendChild(link);
        });
        
        console.log('Dynamic nav: Header menu items injected');
        return true;
        */
    }

    function getIconSvg(iconName) {
        const icons = {
            'zap': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
            'layers': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
            'help-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            'box': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'
        };
        return icons[iconName] || '';
    }

    window.addEventListener('popstate', async () => {
        try {
            const hash = window.location.hash.slice(1);
            if (hash.includes('/')) {
                const parts = hash.split('/');
                const category = parts[0];
                const pageId = parts[1];

                if (category !== currentCategory) {
                    await switchCategory(category);
                }

                const currentPage = await getPageFromId(pageId, category); // Now async

                if (currentPage) {
                    updateActiveState(currentPage.id);
                    await renderContent(currentPage.id, currentPage.page, category);
                }
            }
        } catch (error) {
            console.error('Error handling popstate:', error);
        }
    });

    // Helper to find page object
    async function getPageFromId(pageId, category) {
        // Ensure data is loaded
        const categoryData = await loadCategoryData(category);
        if (!categoryData) return null;

        for (const section of categoryData.sections) {
            for (const child of section.children) {
                if (child.id === pageId) {
                    return child;
                }
            }
        }
        return null;
    }

    // Main initialization
    async function init() {
        try {
            const sidebar = await waitForElement('aside');
            console.log('Dynamic nav: Sidebar found, initializing...');

            // Fetch registry
            navRegistry = await fetchNavRegistry();
            console.log('Dynamic nav: nav.json registry loaded');

            if (navRegistry.categories && navRegistry.categories.length > 0) {
                DEFAULT_CATEGORY = navRegistry.categories[0].id;
                DEFAULT_PAGE = navRegistry.categories[0].defaultPage;
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            const headerInjected = injectHeaderMenuItems();
            if (!headerInjected) {
                setTimeout(injectHeaderMenuItems, 500);
            }

            const hash = window.location.hash.slice(1);
            if (hash.includes('/')) {
                const parts = hash.split('/');
                currentCategory = parts[0];
            } else {
                currentCategory = DEFAULT_CATEGORY;
            }

            await buildNavigation(sidebar, currentCategory);
            updateHeaderActiveState(currentCategory);

            console.log('Dynamic nav: Navigation built successfully');

            // Expose for Search Module
            window.navRegistry = navRegistry; // Exposed for search.js to discover files
            window.switchCategory = switchCategory;
            window.navigateToPage = async (pageId, category, anchor = '') => {
                if (currentCategory !== category) {
                    await switchCategory(category);
                }
                updateHash(pageId, category, anchor);
                updateActiveState(pageId);
                const pagePath = await getPagePath(pageId, category);
                if (pagePath) {
                    await renderContent(pageId, pagePath, category, anchor);
                }
            };

        } catch (error) {
            console.error('Dynamic nav initialization failed:', error);
        }
    }

    // Helper to find page path from ID
    async function getPagePath(pageId, category) {
        const page = await getPageFromId(pageId, category);
        return page ? page.page : '';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
