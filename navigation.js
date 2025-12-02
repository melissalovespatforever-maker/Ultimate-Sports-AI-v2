// ============================================
// MODERN NAVIGATION MANAGER
// Mobile-First Navigation System
// ============================================

export class ModernNavigation {
    constructor() {
        console.log('🚀 ModernNavigation constructor called');
        this.currentPage = 'home';
        this.drawerOpen = false;
        this.init();
    }

    init() {
        console.log('⚙️ ModernNavigation init called');
        this.setupDrawer();
        this.setupBottomNav();
        this.setupPageNavigation();
        console.log('✅ ModernNavigation fully initialized');
    }

    setupDrawer() {
        console.log('📋 Setting up drawer...');
        const menuBtn = document.getElementById('menu-btn');
        const drawerOverlay = document.getElementById('drawer-overlay');
        const drawerNav = document.getElementById('drawer-nav');
        const drawerCloseBtn = document.getElementById('drawer-close-btn');
        const upgradeBtn = document.querySelector('.upgrade-button-header');

        console.log('🔍 Menu button found:', !!menuBtn);
        console.log('🔍 Drawer overlay found:', !!drawerOverlay);
        console.log('🔍 Drawer nav found:', !!drawerNav);

        if (menuBtn) {
            console.log('✅ Adding click listener to menu button');
            menuBtn.addEventListener('click', () => {
                console.log('🎯 Menu button clicked!');
                this.toggleDrawer();
            });
        } else {
            console.error('❌ Menu button not found!');
        }

        if (drawerOverlay) {
            drawerOverlay.addEventListener('click', () => this.closeDrawer());
        }

        if (drawerCloseBtn) {
            drawerCloseBtn.addEventListener('click', () => this.closeDrawer());
        }

        // Upgrade button in drawer header
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                // Show subscription modal
                const event = new CustomEvent('upgrade-clicked');
                window.dispatchEvent(event);
                this.closeDrawer();
            });
        }

        // Menu items in drawer
        const menuItems = document.querySelectorAll('.menu-item[data-page]');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
                this.closeDrawer();
            });
        });
    }

    setupBottomNav() {
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item[data-page]');
        bottomNavItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    setupPageNavigation() {
        // Quick action cards
        const quickActions = document.querySelectorAll('.quick-action-card[data-action]');
        quickActions.forEach(action => {
            action.addEventListener('click', () => {
                const page = action.dataset.action;
                this.navigateTo(page);
            });
        });

        // Section actions
        const sectionActions = document.querySelectorAll('[data-navigate]');
        sectionActions.forEach(action => {
            action.addEventListener('click', () => {
                const page = action.dataset.navigate;
                this.navigateTo(page);
            });
        });
    }

    toggleDrawer() {
        console.log('🔄 Toggle drawer called, currently:', this.drawerOpen);
        if (this.drawerOpen) {
            this.closeDrawer();
        } else {
            this.openDrawer();
        }
    }

    openDrawer() {
        console.log('📂 Opening drawer...');
        this.drawerOpen = true;
        const drawerOverlay = document.getElementById('drawer-overlay');
        const drawerNav = document.getElementById('drawer-nav');
        
        if (drawerOverlay) {
            drawerOverlay.classList.add('active');
            console.log('✅ Drawer overlay activated');
        }
        if (drawerNav) {
            drawerNav.classList.add('active');
            console.log('✅ Drawer nav activated');
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        console.log('✅ Drawer opened successfully');
    }

    closeDrawer() {
        this.drawerOpen = false;
        const drawerOverlay = document.getElementById('drawer-overlay');
        const drawerNav = document.getElementById('drawer-nav');
        
        if (drawerOverlay) drawerOverlay.classList.remove('active');
        if (drawerNav) drawerNav.classList.remove('active');
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    navigateTo(page) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(p => {
            p.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
        }

        // Update active states in navigation
        this.updateActiveStates(page);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Close drawer if open
        this.closeDrawer();
    }

    updateActiveStates(page) {
        // Update drawer menu items
        const menuItems = document.querySelectorAll('.menu-item[data-page]');
        menuItems.forEach(item => {
            if (item.dataset.page === page) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update bottom nav items
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item[data-page]');
        bottomNavItems.forEach(item => {
            if (item.dataset.page === page) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    getCurrentPage() {
        return this.currentPage;
    }

    updateDrawerProfile(user) {
        const usernameEl = document.getElementById('drawer-username');
        const tierEl = document.getElementById('drawer-tier');
        const accuracyEl = document.getElementById('drawer-accuracy-value');
        const levelEl = document.getElementById('drawer-level');

        if (usernameEl) usernameEl.textContent = user.username;
        if (tierEl) tierEl.textContent = `${user.subscription || 'FREE'} Member`;
        if (accuracyEl) accuracyEl.textContent = `${user.stats?.winRate ? Math.round(user.stats.winRate * 100) : 68}%`;
        if (levelEl) levelEl.textContent = user.level;
    }
}

// Create singleton instance
export const modernNav = new ModernNavigation();
