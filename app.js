// ============================================
// ULTIMATE SPORTS AI - CORE APP ENGINE v4.0
// FAST & WORKING - No external dependencies
// ============================================
// FILE: app.js
// Replace your existing app.js with this
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
        showToast('Logged out', 'success');
        navigation.navigateTo('home');
    }

    handleOAuthCallback() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (token) {
            localStorage.setItem('auth_token', token);
            window.history.replaceState({}, '', window.location.pathname);
            this.checkToken();
        }
    }
}

const authManager = new AuthManager();

// ============================================
// PART 6: NAVIGATION
// ============================================

class Navigation {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        // Drawer toggle
        document.getElementById('menu-btn')?.addEventListener('click', () => {
            const drawer = document.getElementById('drawer-nav');
            const overlay = document.getElementById('drawer-overlay');
            drawer?.classList.toggle('active');
            overlay?.classList.toggle('active');
        });

        document.getElementById('drawer-overlay')?.addEventListener('click', () => {
            document.getElementById('drawer-nav')?.classList.remove('active');
            document.getElementById('drawer-overlay')?.classList.remove('active');
        });

        // Bottom nav
        document.querySelectorAll('.bottom-nav-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigateTo(btn.dataset.page);
                document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Drawer menu
        document.querySelectorAll('.menu-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigateTo(btn.dataset.page);
                document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('drawer-nav')?.classList.remove('active');
                document.getElementById('drawer-overlay')?.classList.remove('active');
            });
        });

        // Quick action cards
        document.querySelectorAll('.quick-action-card[data-page]').forEach(card => {
            card.addEventListener('click', () => this.navigateTo(card.dataset.page));
        });

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (appState.isAuthenticated) {
                authManager.logout();
            } else {
                this.navigateTo('auth');
            }
        });

        // Upgrade button
        document.getElementById('upgrade-btn')?.addEventListener('click', () => {
            this.navigateTo('subscription');
        });

        // Profile button in header
        document.querySelector('.profile-btn')?.addEventListener('click', () => {
            this.navigateTo('profile');
        });

        console.log('✅ Navigation initialized');
    }

    navigateTo(page) {
        console.log(`📍 Navigate to: ${page}`);
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
            window.scrollTo(0, 0);
        } else {
            console.warn(`Page not found: ${page}`);
        }
    }
}

const navigation = new Navigation();

// ============================================
// PART 7: AUTH UI
// ============================================

class AuthUI {
    constructor() {
        this.init();
    }

    init() {
        // Continue as Guest
        document.getElementById('continue-as-guest-btn')?.addEventListener('click', () => {
            navigation.navigateTo('home');
        });

        // OAuth buttons
        ['google', 'apple'].forEach(provider => {
            document.getElementById(`${provider}-login-btn`)?.addEventListener('click', () => {
                window.location.href = api.getOAuthURL(provider);
            });
            document.getElementById(`${provider}-signup-btn`)?.addEventListener('click', () => {
                window.location.href = api.getOAuthURL(provider);
            });
        });

        // Auth form toggle
        document.getElementById('show-signup')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('signup-form').style.display = 'block';
        });

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signup-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        });

        // Login form
        document.getElementById('login-form-element')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            if (await authManager.login(email, password)) {
                navigation.navigateTo('home');
            }
        });

        // Signup form
        document.getElementById('signup-form-element')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const username = document.getElementById('signup-username').value;
            if (await authManager.signup(email, password, username)) {
                navigation.navigateTo('home');
            }
        });

        console.log('✅ Auth UI initialized');
    }
}

const authUI = new AuthUI();

// ============================================
// PART 8: UI UPDATES
// ============================================

function updateUI() {
    const user = appState.user;
    
    // Update display name
    const displayName = document.getElementById('user-display-name');
    if (displayName) displayName.textContent = user?.name || 'Guest User';
    
    // Update avatar
    const avatar = document.getElementById('drawer-user-avatar');
    if (avatar) avatar.textContent = user?.avatar || '😊';
    
    // Update tier badge
    const tierBadge = document.getElementById('user-tier-badge');
    if (tierBadge) {
        const tier = user?.subscription_tier || 'free';
        tierBadge.textContent = tier.toUpperCase() + ' TIER';
        tierBadge.className = `user-tier tier-${tier.toLowerCase()}`;
    }
}

appState.subscribe(updateUI);

// ============================================
// PART 9: TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    toast.style.cssText = `
        padding: 16px 24px;
        margin: 12px;
        border-radius: 8px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease;
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.showToast = showToast;

// ============================================
// PART 10: INITIALIZATION
// ============================================

function initApp() {
    console.log('⚙️ Initializing app...');
    
    // Update UI
    updateUI();
    
    // Check OAuth callback
    authManager.handleOAuthCallback();
    
    // Check for first visit
    const hasSeenPicker = localStorage.getItem('hasSeenUsernamePicker');
    if (!hasSeenPicker && !appState.isAuthenticated) {
        showGuestUsernamePicker();
    }
    
    console.log('✅ App ready');
}

function showGuestUsernamePicker() {
    const modal = document.createElement('div');
    modal.id = 'guest-username-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            border-radius: 24px;
            max-width: 450px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        ">
            <div style="font-size: 64px; margin-bottom: 20px;">👋</div>
            <h2 style="font-size: 32px; font-weight: 800; color: white; margin-bottom: 12px;">Welcome!</h2>
            <p style="font-size: 16px; color: rgba(255, 255, 255, 0.9); margin-bottom: 30px;">
                What's your name?
            </p>
            <input 
                type="text" 
                id="guest-username-input"
                placeholder="Enter your name"
                style="
                    width: 100%;
                    padding: 16px 20px;
                    font-size: 18px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.95);
                    margin-bottom: 24px;
                    box-sizing: border-box;
                "
                maxlength="20"
            >
            <div style="display: flex; gap: 12px;">
                <button onclick="
                    const name = document.getElementById('guest-username-input').value || 'Guest';
                    localStorage.setItem('guestUsername', name);
                    localStorage.setItem('hasSeenUsernamePicker', 'true');
                    appState.user.name = name;
                    appState.notify();
                    document.getElementById('guest-username-modal').remove();
                    showToast('Welcome, ' + name + '! 🎉', 'success');
                " style="
                    flex: 1;
                    padding: 16px 24px;
                    font-size: 16px;
                    font-weight: 700;
                    border: none;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    cursor: pointer;
                ">
                    Get Started 🚀
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// ============================================
// PART 11: START
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

console.log('✅ App.js loaded successfully');
    
