// ============================================
// ULTIMATE SPORTS AI - CORE APPLICATION ENGINE
// ============================================
//
// SYSTEM ARCHITECTURE NOTES:
// -------------------------
// 1. Buildless Architecture: Uses native ES Modules (ESM) and standard browser APIs.
//    - No Webpack, Parcel, or Vite required.
//    - Fast startup, no compilation step.
//
// 2. Global State Management:
//    - Uses `global-state-manager.js` as the Redux-like store.
//    - `appState` in this file serves as the local reactive wrapper.
//
// 3. Module Loading Strategy:
//    - Critical path (Auth, State, Data) loads first.
//    - UI modules (Coaches, Live Scores) load on demand or lazily.
//
// 4. Data Flow:
//    - API Service -> SportsDataService -> Global State -> UI Components
//
// ============================================

console.log('🚀 Ultimate Sports AI v4.0 - STARTING');

// ============================================
// PART 1: APP INITIALIZATION & LOADER
// ============================================
// NOTE: Handles the immediate user experience while core systems boot.

function hideLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) {
        // Smooth fade out
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (loader && loader.parentElement) {
                loader.remove(); // Clean DOM removal
            }
        }, 300);
    }
}

// Strategy: Attempt to hide loader as soon as DOM is ready, 
// but have a failsafe timeout in case of script errors.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideLoader);
} else {
    hideLoader();
}

// Failsafe: Force hide after 1.5s
setTimeout(hideLoader, 1500);

// ============================================
// PART 2: CONFIGURATION & ENVIRONMENT
// ============================================
// NOTE: Global config is now loaded from config.js.
// This ensures all modules share the same API endpoints.

const CONFIG = window.CONFIG || {
    API_BASE_URL: 'https://ultimate-sports-ai-backend-production.up.railway.app',
    WS_URL: 'wss://ultimate-sports-ai-backend-production.up.railway.app',
    VERSION: '4.0.0',
    REQUEST_TIMEOUT: 10000
};

window.CONFIG = CONFIG;

// ============================================
// PART 3: STATE MANAGEMENT WRAPPER
// ============================================
// NOTE: Replaced by GlobalStateManager (loaded previously).
// This section now ensures we're using the global single source of truth.

if (!window.appState && !window.globalState) {
    console.error('CRITICAL: Global State Manager not loaded!');
}

// Ensure appState global variable refers to the window.appState (from global-state-manager)
// In non-strict mode, assignment to undeclared variable sets property on global object (window)
// prevent 'const appState' redeclaration error by just using the global one.

// ============================================
// PART 4: API LAYER
// ============================================
// NOTE: Handles all HTTP communication with the backend.
// Features automatic token injection and timeout handling.

class APIService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        // Auto-inject JWT token if present
        const token = localStorage.getItem('auth_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    async request(endpoint, options = {}) {
        // Implement timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers: this.getHeaders(),
                signal: controller.signal,
                credentials: 'include'
            });

            clearTimeout(timeoutId);

            // Handle 500 errors gracefully
            if (response.status >= 500) {
                try { await response.text(); } catch (e) {} // Consume
                const error = new Error(`Server Error ${response.status}`);
                error.status = response.status;
                throw error;
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) throw new Error(data.message || 'Request failed');
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Check if it's a 500 and should be suppressed
            if (window.errorHandler && typeof window.errorHandler.handleError === 'function') {
                window.errorHandler.handleError(error, `API Error [${endpoint}]`, { 
                    logToConsole: true,
                    category: 'network'
                });
            } else {
                console.warn(`API Error [${endpoint}]:`, error.message);
            }
            
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
// PART 5: AUTHENTICATION FLOW
// ============================================
// NOTE: Manages the user session lifecycle (Login, Signup, Logout, Token Validation).

class AuthManager {
    constructor() {
        this.checkToken();
    }

    // Verify existing session on app start
    checkToken() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            api.getCurrentUser()
                .then(res => {
                    const user = res.user || res;
                    appState.setUser(user);
                    
                    // Check for daily rewards after successful token verification
                    if (window.dailyRewards) {
                        setTimeout(() => window.dailyRewards.checkRewards(), 2000);
                    }
                })
                .catch(() => {
                    // Invalid token, clear it
                    localStorage.removeItem('auth_token');
                });
        }
    }

    async signup(email, password, username) {
        try {
            console.log('📝 Signup attempt for:', email);
            const response = await api.signup(email, password, username);
            
            const token = response.accessToken || response.token;
            const user = response.user;
            
            if (!token || !user) throw new Error('Invalid response from server');
            
            localStorage.setItem('auth_token', token);
            appState.setUser(user);
            
            // Reconcile guest inventory and stats with account
            if (window.globalState) {
                window.globalState.reconcileInventory();
                window.globalState.reconcileStats();
            }
            
            showToast('Account created! 🎉', 'success');
            
            // Check for daily rewards after signup
            if (window.dailyRewards) {
                setTimeout(() => window.dailyRewards.checkRewards(), 2000);
            }

            // Trigger Tutorial for new users
            setTimeout(() => {
                if (window.tutorialSystem) window.tutorialSystem.start();
            }, 1000);

            return true;
        } catch (error) {
            this.handleAuthError(error, 'Signup');
            return false;
        }
    }

    async login(email, password) {
        try {
            console.log('🔐 Login attempt for:', email);
            const response = await api.login(email, password);
            
            if (response.requiresTwoFactor) {
                showToast('2FA required', 'info');
                return false;
            }
            
            const token = response.accessToken || response.token;
            const user = response.user;
            
            if (!token || !user) throw new Error('Invalid response from server');
            
            localStorage.setItem('auth_token', token);
            appState.setUser(user);
            
            // Reconcile guest inventory and stats with account
            if (window.globalState) {
                window.globalState.reconcileInventory();
                window.globalState.reconcileStats();
            }
            
            showToast('Welcome back! 🎉', 'success');

            // Check for daily rewards after successful login
            if (window.dailyRewards) {
                setTimeout(() => window.dailyRewards.checkRewards(), 2000);
            }

            // Check if they need a tutorial refresher
            setTimeout(() => {
                if (window.tutorialSystem) window.tutorialSystem.start();
            }, 1000);

            return true;
        } catch (error) {
            this.handleAuthError(error, 'Login');
            return false;
        }
    }

    handleAuthError(error, context) {
        console.error(`❌ ${context} error:`, error);
        let msg = error.message || `${context} failed`;
        
        // User-friendly error mapping
        if (msg.includes('409')) msg = 'Email already registered';
        if (msg.includes('404')) msg = 'Email not found';
        if (msg.includes('401')) msg = 'Invalid credentials';
        if (msg.includes('500') || msg.includes('Internal Server Error')) msg = 'Our servers are acting up. Please try again!';
        
        showToast(msg, 'error');
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
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
            this.checkToken();
        }
    }
}

const authManager = new AuthManager();
// Expose for other modules (like auth.js)
window.authManager = authManager;

// ============================================
// PART 6: NAVIGATION SYSTEM
// ============================================
// NOTE: Single Page Application (SPA) router.
// Swaps visible sections and triggers lifecycle events for components.

class Navigation {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        // Event Delegation for Navigation
        this.setupDrawer();
        this.setupBottomNav();
        this.setupMenuLinks();
        

    }

    setupDrawer() {
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
    }

    setupBottomNav() {
        document.querySelectorAll('.bottom-nav-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigateTo(btn.dataset.page);
                this.updateActiveNav(btn);
            });
        });
    }

    setupMenuLinks() {
        document.querySelectorAll('.menu-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigateTo(btn.dataset.page);
                this.updateActiveNav(btn);
                // Close drawer on selection
                document.getElementById('drawer-nav')?.classList.remove('active');
                document.getElementById('drawer-overlay')?.classList.remove('active');
            });
        });

        // Quick Actions
        document.querySelectorAll('.quick-action-card[data-page]').forEach(card => {
            card.addEventListener('click', () => this.navigateTo(card.dataset.page));
        });

        // Auth & Profile Links
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (appState.isAuthenticated) authManager.logout();
            else this.navigateTo('auth');
        });

        document.querySelector('.profile-btn')?.addEventListener('click', () => this.navigateTo('profile'));
        document.getElementById('upgrade-btn')?.addEventListener('click', () => this.navigateTo('subscription'));
    }

    updateActiveNav(activeBtn) {
        // Clear all active states
        document.querySelectorAll('.bottom-nav-item, .menu-item').forEach(b => b.classList.remove('active'));
        // Set new active state
        activeBtn.classList.add('active');
    }

    navigateTo(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
            window.scrollTo(0, 0);
            
            // Trigger Module Lifecycle Event
            this.triggerPageLoad(page);
        }
    }
    
    triggerPageLoad(page) {
        // Notify modules that their view is now active
        
        switch(page) {
            case 'live-scores':
                if (window.liveScoresManager) window.liveScoresManager.load();
                break;
            case 'ai-coaches':
                window.dispatchEvent(new CustomEvent('aiCoachesPageLoad'));
                break;
            case 'analytics':
                window.dispatchEvent(new CustomEvent('analyticsPageLoad'));
                break;
            case 'tournaments':
                window.dispatchEvent(new CustomEvent('tournamentsPageLoad'));
                break;
            case 'settings':
                window.dispatchEvent(new CustomEvent('settingsPageLoad'));
                break;
            case 'profile':
                if (window.profileManager) window.profileManager.load();
                break;
        }
    }
}

const navigation = new Navigation();

// Expose navigation globally as appNavigation to avoid conflict with native window.navigation
window.appNavigation = navigation;

// Trigger initial page load
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = navigation.currentPage || 'home';
    setTimeout(() => {
        navigation.triggerPageLoad(currentPage);
    }, 200);
});

// ============================================
// PART 7: AUTH UI HANDLERS
// ============================================
// NOTE: Manages the Login/Signup forms and buttons.
// CRITICAL: Form submission logic is handled by 'auth.js' to prevent double-submission.
// This class now only handles Guest Access and OAuth redirections.

class AuthUI {
    constructor() {
        this.init();
    }

    init() {
        // GUEST ACCESS REMOVED - Authentication required for all features
        
        // OAuth
        ['google', 'apple'].forEach(provider => {
            const btn = document.getElementById(`${provider}-login-btn`);
            if (btn) btn.addEventListener('click', () => window.location.href = api.getOAuthURL(provider));
            
            const signupBtn = document.getElementById(`${provider}-signup-btn`);
            if (signupBtn) signupBtn.addEventListener('click', () => window.location.href = api.getOAuthURL(provider));
        });
    }
    
    // Form toggling and submission is delegated to auth.js
}

const authUI = new AuthUI();

// ============================================
// PART 8: REACTIVE UI UPDATES
// ============================================
// NOTE: Updates the DOM when appState changes.

function updateUI() {
    const user = appState.user;
    
    // Header
    const displayName = document.getElementById('user-display-name');
    if (displayName) displayName.textContent = user?.name || 'Guest User';
    
    // Avatar
    const avatar = document.getElementById('drawer-user-avatar');
    if (avatar) avatar.textContent = user?.avatar || '😊';
    
    // Tier Badge
    const tierBadge = document.getElementById('user-tier-badge');
    if (tierBadge) {
        const tier = user?.subscription_tier || 'free';
        tierBadge.textContent = tier.toUpperCase() + ' TIER';
        tierBadge.className = `user-tier tier-${tier.toLowerCase()}`;
    }

    // Admin Button Visibility
    const adminBtn = document.getElementById('admin-dashboard-btn');
    if (adminBtn) {
        if (user && user.is_admin) {
            adminBtn.style.display = 'flex';
        } else {
            adminBtn.style.display = 'none';
        }
    }
}

// Subscribe to state changes
appState.subscribe(updateUI);

// ============================================
// PART 9: NOTIFICATION SYSTEM
// ============================================
// NOTE: Simple toast notification system.

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    // Inline styles for reliability
    toast.style.cssText = `
        padding: 16px 24px;
        margin: 12px;
        border-radius: 8px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease;
        opacity: 1;
    `;

    container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.showToast = showToast;

// ============================================
// PART 10: APP ENTRY POINT
// ============================================
// NOTE: The main execution flow. 

function initApp() {
    console.log('⚙️ Initializing app components...');
    
    // 1. Initial UI Render
    updateUI();
    
    // 2. Process OAuth Redirects
    authManager.handleOAuthCallback();
    
    // 3. Start Onboarding / Tutorial Flow
    // Critical: Checks Age Gate -> Onboarding -> Tutorial sequence
    checkAgeAndOnboarding();
    
    console.log('✅ App fully loaded');
}

// ============================================
// PART 11: ONBOARDING FLOW CONTROLLER
// ============================================

function checkAgeAndOnboarding() {
    // Phase 1: Age Verification
    const isAgeVerified = sessionStorage.getItem('age_verified') === 'true';
    
    if (!isAgeVerified) {
        console.log('🔞 Waiting for age verification...');
        // The Age Verification script triggers this event on success
        window.addEventListener('age-verified', () => {
            console.log('🔞 Age verified. Proceeding to onboarding.');
            handleOnboardingFlow();
        }, { once: true });
    } else {
        handleOnboardingFlow();
    }
}

function handleOnboardingFlow() {
    // REGISTRATION REQUIRED: No guest access allowed
    if (appState.isAuthenticated) {
        console.log('👤 User authenticated. Welcome!');
        return;
    }

    // Redirect to authentication page - No guest option
    const hasSeenAuthPrompt = sessionStorage.getItem('auth_prompt_shown');
    
    if (!hasSeenAuthPrompt) {
        console.log('🔐 Authentication required. Showing sign-up modal.');
        sessionStorage.setItem('auth_prompt_shown', 'true');
        showAuthRequiredModal();
    }
}

function showAuthRequiredModal() {
    if (document.getElementById('auth-required-modal')) return;

    // Create authentication-required modal
    const modal = document.createElement('div');
    modal.id = 'auth-required-modal';
    modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.98);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        animation: fadeIn 0.4s ease-out;
    `;

    // Modal Content - No Guest Option
    modal.innerHTML = `
        <div style="
            background: linear-gradient(145deg, #1e293b, #0f172a);
            padding: 40px;
            border-radius: 24px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
        ">
            <!-- Decorative Elements -->
            <div style="position: absolute; top: -50px; left: -50px; width: 150px; height: 150px; background: rgba(16, 185, 129, 0.2); filter: blur(50px); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -50px; right: -50px; width: 150px; height: 150px; background: rgba(59, 130, 246, 0.2); filter: blur(50px); border-radius: 50%;"></div>

            <div style="position: relative; z-index: 1;">
                <div style="font-size: 64px; margin-bottom: 24px; animation: bounce 2s infinite;">🔐</div>
                <h2 style="font-size: 32px; font-weight: 800; color: white; margin-bottom: 12px;">Authentication Required</h2>
                <p style="font-size: 16px; color: #94a3b8; margin-bottom: 24px; line-height: 1.6;">
                    Create a free account to access Ultimate Sports AI.<br>
                    <strong style="color: #10b981;">Your data, progress, and coins are saved forever.</strong>
                </p>

                <!-- Benefits List -->
                <div style="background: rgba(16, 185, 129, 0.1); border-radius: 16px; padding: 20px; margin-bottom: 32px; border: 1px solid rgba(16, 185, 129, 0.2); text-align: left;">
                    <div style="color: #e2e8f0; font-size: 14px; font-weight: 600; margin-bottom: 12px; text-align: center;">✨ Free Account Benefits</div>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                        <li>💰 10,000 Ultimate Coins starting balance</li>
                        <li>🎮 Access to all mini-games & features</li>
                        <li>🤖 AI-powered sports predictions</li>
                        <li>📊 Full transaction & game history</li>
                        <li>🏆 Achievements & leaderboards</li>
                        <li>☁️ Cloud-synced progress across devices</li>
                    </ul>
                </div>

                <!-- Account Actions -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <button id="auth-modal-signin-btn" style="padding: 16px; border-radius: 12px; background: rgba(30, 41, 59, 0.5); color: white; border: 1px solid #334155; cursor: pointer; font-weight: 600; font-size: 15px;">Sign In</button>
                    <button id="auth-modal-signup-btn" style="padding: 16px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; cursor: pointer; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">Create Free Account 🚀</button>
                </div>

                <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
                    🔒 Your data is secure and never shared with third parties.
                </p>
            </div>
        </div>
        <style>
            @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        </style>
    `;

    document.body.appendChild(modal);

    // -- Event Handlers --

    // Sign In
    modal.querySelector('#auth-modal-signin-btn').onclick = () => {
        modal.remove();
        navigation.navigateTo('auth');
        // Ensure login form is visible
        setTimeout(() => {
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            if (loginForm) loginForm.style.display = 'block';
            if (signupForm) signupForm.style.display = 'none';
        }, 100);
    };

    // Sign Up (Primary CTA)
    modal.querySelector('#auth-modal-signup-btn').onclick = () => {
        modal.remove();
        navigation.navigateTo('auth');
        // Ensure signup form is visible
        setTimeout(() => {
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            if (loginForm) loginForm.style.display = 'none';
            if (signupForm) signupForm.style.display = 'block';
        }, 100);
    };
}

// ============================================
// PART 13: IFRAME COMMUNICATION
// ============================================
// NOTE: Handles messages from nested iframes (like Sports Lounge)

window.addEventListener('message', (event) => {
    // Security check: ensure origin is trusted (same-origin for now)
    // if (event.origin !== window.location.origin) return; 

    if (!event.data) return;

    // Handle Navigation Requests
    if (event.data.type === 'navigate') {
        console.log('📍 Received navigation request from iframe:', event.data.page);
        if (window.appNavigation) {
            window.appNavigation.navigateTo(event.data.page);
        }
    }

    // Handle Toast Requests
    if (event.data.type === 'toast') {
        if (window.showToast) {
            window.showToast(event.data.message, event.data.level || 'info');
        }
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

console.log('✅ App.js loaded successfully');