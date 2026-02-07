/**
 * Global Search System
 *
 * Indexes all markdown pages from nav.json and provides a fast fuzzy search.
 * Features:
 * - Pre-loads and indexes content on page load
 * - Command palette style UI (⌘K / Ctrl+K)
 * - Navigation highlighting and category switching
 * - Deep linking to headings
 * - Full-text search with context
 * - Aggregates data from split category files
 */

(function () {
    'use strict';

    // Constants
    const SEARCH_TRIGGER_KEY = 'k';
    const MAX_RESULTS = 20;

    // State
    const BASE_URL = window.SITE_CONFIG?.baseUrl || '';
    let searchIndex = [];
    let isIndexReady = false;
    let selectedIndex = 0;
    let isOpen = false;
    let results = [];

    // UI Elements
    let modalOverlay = null;
    let searchInput = null;
    let resultsContainer = null;

    // --- Indexing ---

    async function buildIndex() {
        try {
            // 1. Fetch Registry
            // Try to use window.navRegistry if dynamic-nav loaded it, else fetch
            let navRegistry = window.navRegistry;
            if (!navRegistry) {
                const response = await fetch(BASE_URL + '/navigation/nav.json');
                navRegistry = await response.json();
            }

            if (!navRegistry || !navRegistry.categories) {
                console.warn('Search: No categories found in registry');
                return;
            }

            // 2. Fetch all category data files in parallel
            const categoryPromises = navRegistry.categories.map(async (categoryMeta) => {
                if (!categoryMeta.dataFile) return null;
                try {
                    // dataFile starts with /, so prepend BASE_URL
                    const res = await fetch(BASE_URL + categoryMeta.dataFile);
                    if (!res.ok) throw new Error(`Failed to fetch ${categoryMeta.dataFile}`);
                    const data = await res.json();
                    return {
                        id: categoryMeta.id,
                        title: categoryMeta.title,
                        heading: categoryMeta.heading,
                        data: data
                    };
                } catch (e) {
                    console.warn(`Search: Failed to load data for ${categoryMeta.id}`, e);
                    return null;
                }
            });

            const loadedCategories = (await Promise.all(categoryPromises)).filter(Boolean);

            // 3. Flatten structure for indexing
            const newIndex = [];

            // Helper to recursively process navigation items
            const processItems = (items, categoryId, sectionTitle) => {
                items.forEach(item => {
                    if (item.children) {
                        processItems(item.children, categoryId, item.title || sectionTitle);
                    } else if (item.page) {
                        newIndex.push({
                            type: 'page',
                            id: item.id,
                            title: item.title,
                            category: categoryId,
                            section: sectionTitle,
                            page: item.page,
                            url: item.id, // Base page ID
                            anchor: '',
                            content: ''
                        });
                    }
                });
            };

            loadedCategories.forEach(cat => {
                const sections = cat.data.sections || [];
                sections.forEach(section => {
                    processItems(section.children, cat.id, section.title);
                });
            });

            // 4. Fetch content for all pages (Granular Indexing)
            const BATCH_SIZE = 5;
            const granularIndex = [];

            for (let i = 0; i < newIndex.length; i += BATCH_SIZE) {
                const batch = newIndex.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (pageItem) => {
                    try {
                        // page usually doesn't start with /
                        const res = await fetch(BASE_URL + '/' + pageItem.page);
                        if (res.ok) {
                            const text = await res.text();

                            // Parse markdown headings to create granular index items
                            const sections = parseMarkdownSections(text, pageItem);
                            granularIndex.push(...sections);
                        }
                    } catch (e) {
                        console.warn('Failed to index page:', pageItem.page);
                    }
                }));
            }

            searchIndex = granularIndex;
            isIndexReady = true;
            console.log(`Search index built: ${searchIndex.length} items indexed from ${loadedCategories.length} categories`);

        } catch (error) {
            console.error('Search indexing failed:', error);
        }
    }

    /**
     * Parses markdown text and splits it into searchable sections based on headings
     */
    function parseMarkdownSections(markdown, pageItem) {
        const lines = markdown.split('\n');
        const items = [];

        let currentHeader = pageItem.title;
        let currentAnchor = '';
        let currentContent = [];

        // Add the main page entry first (mostly for the title match)
        items.push({
            ...pageItem,
            content: '', // Will fill below, but this is the "main" entry
            isHeader: true
        });

        // Helper to save current section
        const saveSection = () => {
            if (currentContent.length > 0 || currentHeader !== pageItem.title) {
                const contentText = currentContent.join(' ')
                    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Keep link text
                    .replace(/[`*_\-]/g, '') // Remove formatting chars
                    .replace(/\s+/g, ' ') // Collapse whitespace
                    .trim();

                if (contentText.length > 0 || currentHeader) {
                    items.push({
                        ...pageItem,
                        title: currentHeader,
                        anchor: currentAnchor,
                        content: contentText.toLowerCase(),
                        titleLower: currentHeader.toLowerCase(),
                        isSubSection: currentAnchor !== ''
                    });
                }
            }
            currentContent = [];
        };

        for (const line of lines) {
            // Check for H1-H3 headers
            if (line.match(/^#{1,3}\s/)) {
                // Save previous section
                saveSection();

                // Start new section
                const headerText = line.replace(/^#+\s+/, '').trim();
                currentHeader = headerText;
                // Simple slugify for anchor
                currentAnchor = headerText
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-');
            } else {
                currentContent.push(line);
            }
        }
        // Save last section
        saveSection();

        return items;
    }

    // --- Search Logic ---

    function search(query) {
        if (!query || !isIndexReady) return [];

        const queryLower = query.toLowerCase();
        const terms = queryLower.split(' ').filter(t => t.length > 0);

        return searchIndex
            .map(item => {
                let score = 0;

                // Title match (highest priority)
                if (item.titleLower && item.titleLower.includes(queryLower)) score += 100;
                else if (item.titleLower && terms.every(t => item.titleLower.includes(t))) score += 50;

                // Content match
                if (item.content && item.content.includes(queryLower)) score += 20;
                else if (item.content) {
                    const matchedTerms = terms.filter(t => item.content.includes(t));
                    score += matchedTerms.length * 5;
                }

                return { item, score };
            })
            .filter(result => result.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, MAX_RESULTS)
            .map(result => result.item);
    }

    // --- UI Creation ---

    function createSearchUI() {
        // Modal Overlay
        modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm hidden';
        modalOverlay.id = 'search-modal';

        // Modal Content
        const modalContent = document.createElement('div');
        modalContent.className = 'fixed left-[50%] top-[20%] z-50 grid w-full max-w-lg translate-x-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 sm:rounded-lg';

        // Input Wrapper
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'flex items-center border-b px-3';

        // Search Icon
        const searchIcon = document.createElement('svg');
        searchIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 h-4 w-4 shrink-0 opacity-50"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>';

        // Input Field
        searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50';
        searchInput.placeholder = 'Type to search documentation...';

        // Results Container
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'max-h-[300px] overflow-y-auto overflow-x-hidden';

        // Footer
        const footer = document.createElement('div');
        footer.className = 'flex items-center justify-end border-t p-2 text-xs text-muted-foreground bg-muted/50';
        footer.innerHTML = `
            <span class="mx-1">ESC</span> to close
            <span class="mx-1">↑↓</span> to navigate
            <span class="mx-1">↵</span> to select
        `;

        inputWrapper.appendChild(searchIcon.firstChild);
        inputWrapper.appendChild(searchInput);

        modalContent.appendChild(inputWrapper);
        modalContent.appendChild(resultsContainer);
        modalContent.appendChild(footer);

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Event Listeners
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeSearch();
        });

        searchInput.addEventListener('input', handleInput);
        searchInput.addEventListener('keydown', handleKeydown);
    }

    // --- Event Handlers ---

    function handleInput(e) {
        const query = e.target.value.trim();
        results = search(query);
        selectedIndex = 0;
        renderResults();
    }

    function handleKeydown(e) {
        if (e.key === 'Escape') {
            closeSearch();
            return;
        }

        if (results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % results.length;
            updateSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + results.length) % results.length;
            updateSelection();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            selectResult(results[selectedIndex]);
        }
    }

    function toggleSearch(e) {
        if (e.key === SEARCH_TRIGGER_KEY && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (isOpen) closeSearch();
            else openSearch();
        } else if (e.key === 'Escape' && isOpen) {
            closeSearch();
        }
    }

    // --- Rendering ---

    function renderResults() {
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            if (searchInput.value.trim()) {
                const emptyState = document.createElement('div');
                emptyState.className = 'py-6 text-center text-sm text-muted-foreground';
                emptyState.textContent = 'No results found.';
                resultsContainer.appendChild(emptyState);
            }
            return;
        }

        resultsContainer.className = 'max-h-[300px] overflow-y-auto overflow-x-hidden p-1';

        results.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = `relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50`;
            el.setAttribute('role', 'option');
            el.setAttribute('data-index', index);
            if (index === selectedIndex) el.setAttribute('aria-selected', 'true');

            // Snippet logic
            let snippet = '';
            if (item.content) {
                const query = searchInput.value;
                const idx = item.content.indexOf(query.toLowerCase());
                if (idx !== -1) {
                    const start = Math.max(0, idx - 20);
                    const end = Math.min(item.content.length, idx + query.length + 40);
                    snippet = (start > 0 ? '...' : '') + item.content.slice(start, end) + (end < item.content.length ? '...' : '');
                }
            }

            // Context path: Category > Section > Page > [Heading]
            const contextPath = [item.category, item.section]
                .filter(Boolean)
                .map(s => s.replace(/-/g, ' '))
                .join(' > ');

            el.innerHTML = `
                <div class="flex flex-col gap-0.5 w-full">
                    <span class="font-medium flex items-center gap-2">
                        ${item.isSubSection ? '<span class="opacity-50 text-xs">#</span>' : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-70"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>'}
                        ${item.title}
                    </span>
                    ${snippet ? `<span class="text-xs text-muted-foreground truncate ml-5 opacity-80">${snippet}</span>` : ''}
                    <span class="text-[10px] text-muted-foreground ml-5 opacity-60 capitalize">${contextPath}</span>
                </div>
            `;

            el.addEventListener('click', () => selectResult(item));
            el.addEventListener('mouseenter', () => {
                selectedIndex = index;
                updateSelection();
            });

            resultsContainer.appendChild(el);
        });
    }

    function updateSelection() {
        const items = resultsContainer.querySelectorAll('[role="option"]');
        items.forEach(item => {
            const idx = parseInt(item.getAttribute('data-index'));
            if (idx === selectedIndex) {
                item.setAttribute('aria-selected', 'true');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.setAttribute('aria-selected', 'false');
            }
        });
    }

    function selectResult(item) {
        if (!item) return;

        closeSearch();

        // Use the global functions exposed by dynamic-nav.js
        if (window.navigateToPage) {
            // Pass the anchor if it exists
            window.navigateToPage(item.id, item.category, item.anchor);
        } else {
            // Fallback
            let hash = `#${item.category}/${item.id}`;
            if (item.anchor) hash += `#${item.anchor}`;
            window.location.hash = hash;
        }
    }

    function openSearch() {
        if (!modalOverlay) createSearchUI();
        modalOverlay.classList.remove('hidden');
        searchInput.value = '';
        searchInput.focus();
        results = [];
        renderResults();
        isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    function closeSearch() {
        if (modalOverlay) modalOverlay.classList.add('hidden');
        isOpen = false;
        document.body.style.overflow = '';
    }

    // --- Initialization ---

    function init() {
        // Build index in background
        setTimeout(buildIndex, 1000);

        // Listen for keyboard shortcuts
        document.addEventListener('keydown', toggleSearch);

        // Poll for search trigger in Top Nav
        // Since React renders async, we might need to retry a few times
        let retryCount = 0;
        const maxRetries = 20;

        const attachTrigger = () => {
            // Look for inputs or buttons that look like part of a search bar
            const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="Search"]');
            const searchButtons = document.querySelectorAll('button');

            let attached = false;

            searchInputs.forEach(input => {
                // Attach to any search input found in the header
                input.addEventListener('focus', (e) => {
                    e.preventDefault();
                    input.blur(); // Don't let it focus native
                    openSearch();
                });
                input.addEventListener('click', (e) => {
                    e.preventDefault();
                    openSearch();
                });
                attached = true;
            });

            searchButtons.forEach(btn => {
                const text = btn.textContent?.toLowerCase() || '';
                if (text.includes('search') || btn.querySelector('svg.lucide-search') || btn.querySelector('kbd')) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        openSearch();
                    });
                    attached = true;
                }
            });

            if (!attached && retryCount < maxRetries) {
                retryCount++;
                setTimeout(attachTrigger, 500);
            } else if (attached) {
                console.log('Search trigger attached successfully');
            }
        };

        attachTrigger();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
