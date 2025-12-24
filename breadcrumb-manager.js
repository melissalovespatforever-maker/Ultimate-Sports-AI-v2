// ============================================
// BREADCRUMB NAVIGATION MANAGER
// ============================================

class BreadcrumbManager {
    constructor() {
        this.breadcrumbs = [];
        this.pageHierarchy = {
            'home': {
                label: 'Home',
                icon: 'fas fa-home',
                parent: null
            },
            'live': {
                label: 'Live Scores',
                icon: 'fas fa-play-circle',
                parent: 'home'
            },
            'ai-coaches': {
                label: 'AI Coaches',
                icon: 'fas fa-robot',
                parent: 'home'
            },
            'my-bets': {
                label: 'My Bets',
                icon: 'fas fa-ticket-alt',
                parent: 'home'
            },
            'tournaments': {
                label: 'Tournaments',
                icon: 'fas fa-trophy',
                parent: 'home'
            },
            'profile': {
                label: 'Profile',
                icon: 'fas fa-user',
                parent: 'home'
            },
            'settings': {
                label: 'Settings',
                icon: 'fas fa-cog',
                parent: 'profile'
            },
            'subscription': {
                label: 'Upgrade',
                icon: 'fas fa-crown',
                parent: 'home'
            },
            'two-factor': {
                label: 'Security',
                icon: 'fas fa-lock',
                parent: 'settings'
            },
            'auth': {
                label: 'Account',
                icon: 'fas fa-sign-in-alt',
                parent: null
            },
            'analytics': {
                label: 'Analytics',
                icon: 'fas fa-chart-bar',
                parent: 'home'
            },
            'coin-shop': {
                label: 'Shop',
                icon: 'fas fa-coins',
                parent: 'home'
            }
        };

        this.init();
    }

    init() {
        console.log('✅ Breadcrumb manager initialized');
    }

    buildBreadcrumbs(pageName) {
        const breadcrumbs = [];
        let current = pageName;

        // Build the path from current page to root
        while (current) {
            const pageInfo = this.pageHierarchy[current];
            if (!pageInfo) break;

            breadcrumbs.unshift({
                page: current,
                label: pageInfo.label,
                icon: pageInfo.icon,
                isActive: current === pageName
            });

            current = pageInfo.parent;
        }

        // Always include home at the beginning if not already there
        if (!breadcrumbs.some(b => b.page === 'home')) {
            breadcrumbs.unshift({
                page: 'home',
                label: 'Home',
                icon: 'fas fa-home',
                isActive: false
            });
        }

        return breadcrumbs;
    }

    render(pageName) {
        const container = document.getElementById('breadcrumb-container');
        if (!container) return;

        const breadcrumbs = this.buildBreadcrumbs(pageName);

        // Hide breadcrumb on home page
        if (pageName === 'home') {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        // Build HTML
        let html = '';
        breadcrumbs.forEach((crumb, index) => {
            if (index > 0) {
                html += `<span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>`;
            }

            if (crumb.isActive) {
                html += `
                    <span class="breadcrumb-item active" title="${crumb.label}">
                        <i class="breadcrumb-icon ${crumb.icon}"></i>
                        <span>${crumb.label}</span>
                    </span>
                `;
            } else {
                html += `
                    <a class="breadcrumb-item" href="#" data-page="${crumb.page}" title="${crumb.label}">
                        <i class="breadcrumb-icon ${crumb.icon}"></i>
                        <span>${crumb.label}</span>
                    </a>
                `;
            }
        });

        container.innerHTML = html;

        // Add click handlers to breadcrumb links
        container.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                // Try to find our navigation instance (not the browser's built-in)
                if (typeof navigation !== 'undefined' && navigation?.navigateTo) {
                    navigation.navigateTo(page);
                } else if (window.parent?.navigation?.navigateTo) {
                    window.parent.navigation.navigateTo(page);
                } else {
                    console.warn('⚠️ Navigation instance not found');
                }
            });
        });
    }

    update(pageName) {
        this.render(pageName);
    }

    clear() {
        const container = document.getElementById('breadcrumb-container');
        if (container) {
            container.innerHTML = '';
            container.classList.add('hidden');
        }
    }

    // Add custom page to hierarchy
    addPage(pageName, config) {
        this.pageHierarchy[pageName] = {
            label: config.label || pageName,
            icon: config.icon || 'fas fa-file',
            parent: config.parent || 'home'
        };
    }

    // Get current breadcrumb path
    getPath(pageName) {
        return this.buildBreadcrumbs(pageName);
    }
}

// Create global instance
const breadcrumbManager = new BreadcrumbManager();

// Export for use in other modules
window.breadcrumbManager = breadcrumbManager;
