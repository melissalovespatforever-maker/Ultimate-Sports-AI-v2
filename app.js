FILE #1: /app.js
================
COPY THIS ENTIRE FILE AND REPLACE YOUR /app.js

// ============================================
// ULTIMATE SPORTS AI - CORE APP ENGINE v4.0
// FAST & WORKING - No external dependencies
// ============================================

console.log('🚀 Ultimate Sports AI v4.0 - STARTING');

// ============================================
// PART 1: REMOVE LOADER IMMEDIATELY
// ============================================

function hideLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (loader && loader.parentElement) {
                loader.remove();
            }
        }, 300);
    }
}

// Hide loader after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideLoader);
} else {
    hideLoader();
}

// Force hide after 1.5 seconds no matter what
setTimeout(hideLoader, 1500);

// Additional safeguard - check every 100ms and force hide if stuck
let hideAttempts = 0;
const forceHideInterval = setInterval(() => {
    const loader = document.getElementById('app-loader');
    if (loader && loader.style.display !== 'none' && loader.style.opacity !== '0') {
        hideLoader();
        hideAttempts++;
    }
    if (hideAttempts > 2 || !loader) {
        clearInterval(forceHideInterval);
    }
}, 100);

// ============================================
// PART 2: CONFIGURATION
// ============================================

const CONFIG = {
    API_BASE_URL: 'https://ultimate-sports-ai-backend-production.up.railway.app',
    WS_URL: 'wss://ultimate-sports-ai-backend-production.up.railway.app',
    VERSION: '4.0.0',
    REQUEST_TIMEOUT: 10000
};

// Make CONFIG globally available
window.CONFIG = CONFIG;

// ============================================
// PART 3: STATE MANAGEMENT
// ============================================

class AppState {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.listeners = [];
        this.init();
    }

    init() {
        // Load guest data from localStorage
        const savedUsername = localStorage.getItem('guestUsername') || 'Guest User';
        const savedAvatar = localStorage.getItem('guestAvatar') || '😊';
        
        this.user = {
            name: savedUsername,
            avatar: savedAvatar,
            email: 'guest@ultimatesports.ai',
            subscription_tier: 'free'
        };
        
        this.notify();
    }

    setUser(user) {
        this.user = user;
        this.isAuthenticated = !!user.id;
        this.notify();
    }

    clearUser() {
        this.user = { name: 'Guest User', avatar: '😊', email: 'guest@ultimatesports.ai', subscription_tier: 'free' };
        this.isAuthenticated = false;
        localStorage.removeItem('auth_token');
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(l => {
            try { l(this); } catch(e) { console.error(e); }
        });
    }
}

const appState = new AppState();

// ============================================
// PART 4: API SERVICE
// ============================================

class APIService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('auth_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers: this.getHeaders(),
                signal: controller.signal,
                credentials: 'include'
            });

            clearTimeout(timeoutId);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) throw new Error(data.message || 'Request failed');
            return data;
        } catch (error) {
            console.warn('API Error:', error.message);
            throw error;
        }
    }

    async signup(email, password, username) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, username })
        });
    }

    async login(email, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async getCurrentUser() {
        return this.request('/api/auth/me');
    }

    getOAuthURL(provider) {
        return `${this.baseURL}/api/auth/${provider}`;
    }
}

const api = new APIService();

// ============================================
// PART 5: AUTH MANAGER
// ============================================

class AuthManager {
    constructor() {
        this.checkToken();
    }

    checkToken() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            api.getCurrentUser()
                .then(res => {
                    const user = res.user || res;
                    appState.setUser(user);
                })
                .catch(() => localStorage.removeItem('auth_token'));
        }
    }

    async signup(email, password, name) {
        try {
            const response = await api.signup(email, password, name);
            const token = response.accessToken;
            const user = response.user;
            
            if (!token || !user) throw new Error('Invalid response');
            
            localStorage.setItem('auth_token', token);
            appState.setUser(user);
            showToast('Account created! 🎉', 'success');
            return true;
        } catch (error) {
            let msg = error.message;
            if (msg.includes('exists')) msg = 'Email already registered';
            if (msg.includes('password')) msg = 'Password must be 8+ characters';
            if (msg.includes('Unable to connect')) msg = 'Connection failed';
            showToast(msg, 'error');
            return false;
        }
    }

    async login(email, password) {
        try {
            const response = await api.login(email, password);
            
            if (response.requiresTwoFactor) {
                showToast('2FA required', 'info');
                return false;
            }
            
            const token = response.accessToken;
            const user = response.user;
            
            if (!token || !user) throw new Error('Invalid response');
            
            localStorage.setItem('auth_token', token);
            appState.setUser(user);
            showToast('Welcome back! 🎉', 'success');
            return true;
        } catch (error) {
            let msg = error.message;
            if (msg.includes('not found')) msg = 'Email not found';
            if (msg.includes('incorrect')) msg = 'Invalid credentials';
            if (msg.includes('Unable to connect')) msg = 'Connection failed';
            showToast(msg, 'error');
            return false;
        }
    }

    logout() {
        appState.clearUser();
        navigation.navigateTo('auth');
    }
}

const authManager = new AuthManager();

// ============================================
// PART 6: NAVIGATION SYSTEM
// ============================================

class NavigationManager {
    constructor() {
        this.currentPage = null;
        this.previousPage = null;
        this.init();
    }

    init() {
        // Check if app is already loaded
        if (document.readyState !== 'loading') {
            this.setupNavigation();
        } else {
            document.addEventListener('DOMContentLoaded', () => this.setupNavigation());
        }
    }

    setupNavigation() {
        // Menu buttons (desktop)
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) {
                    this.navigateTo(page);
                    this.closeDrawer();
                }
            });
        });

        // Bottom nav buttons (mobile)
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) this.navigateTo(page);
            });
        });

        // Navigation button with authentication check
        document.querySelectorAll('[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = item.dataset.page;
                if (page) {
                    // For profile without auth, show auth page
                    if (page === 'profile' && !appState.isAuthenticated) {
                        this.navigateTo('auth');
                        return;
                    }
                    this.navigateTo(page);
                }
            });
        });

        // Default to home
        if (!this.currentPage) {
            this.navigateTo('home');
        }
    }

    navigateTo(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;

            // Update active nav items
            document.querySelectorAll('.menu-item, .bottom-nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.page === page) {
                    item.classList.add('active');
                }
            });

            // Trigger page-specific loading if needed
            this.triggerPageLoad(page);
        }
    }

    triggerPageLoad(page) {
        // Trigger custom events for pages that need to load data
        const event = new Event(`page-${page}-loaded`);
        document.dispatchEvent(event);
    }

    closeDrawer() {
        const overlay = document.getElementById('drawer-overlay');
        const drawer = document.getElementById('drawer-nav');
        if (overlay) overlay.style.display = 'none';
        if (drawer) drawer.classList.remove('active');
    }
}

const navigation = new NavigationManager();

// ============================================
// PART 7: DRAWER MANAGEMENT
// ============================================

class DrawerManager {
    constructor() {
        this.init();
    }

    init() {
        if (document.readyState !== 'loading') {
            this.setupDrawer();
        } else {
            document.addEventListener('DOMContentLoaded', () => this.setupDrawer());
        }
    }

    setupDrawer() {
        const menuBtn = document.getElementById('menu-btn');
        const overlay = document.getElementById('drawer-overlay');
        const drawer = document.getElementById('drawer-nav');
        const logoutBtn = document.getElementById('logout-btn');

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                if (drawer) drawer.classList.toggle('active');
                if (overlay) overlay.style.display = drawer?.classList.contains('active') ? 'block' : 'none';
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                if (drawer) drawer.classList.remove('active');
                overlay.style.display = 'none';
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authManager.logout();
            });
        }

        // Profile button
        document.querySelectorAll('.profile-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!appState.isAuthenticated) {
                    navigation.navigateTo('auth');
                } else {
                    navigation.navigateTo('profile');
                }
            });
        });

        // Upgrade button
        document.getElementById('upgrade-btn')?.addEventListener('click', () => {
            navigation.navigateTo('subscription');
        });
    }
}

const drawerManager = new DrawerManager();

// ============================================
// PART 8: NOTIFICATIONS
// ============================================

class NotificationManager {
    constructor() {
        this.notifications = [];
    }

    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span>${message}</span>
            </div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

window.showToast = (msg, type) => {
    new NotificationManager().show(msg, type);
};

// ============================================
// PART 9: INITIALIZATION
// ============================================

console.log('✅ Core app engine loaded');
