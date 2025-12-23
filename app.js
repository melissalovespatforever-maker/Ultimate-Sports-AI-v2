// ============================================
// ULTIMATE SPORTS AI - CLEAN APP v4.1 FIXED
// Production-ready frontend with working loader fix
// ============================================

console.log('🚀 Ultimate Sports AI v4.1 - Loading...');

// Remove loader immediately after 1.5 seconds guaranteed
setTimeout(() => {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            loader.remove();
            console.log('✅ Loader removed');
        }, 300);
    }
}, 1500);

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    API_ENDPOINTS: [
        'https://ultimate-sports-ai-backend-production.up.railway.app',
        'http://localhost:3001',
        '/api'
    ],
    API_BASE_URL: 'https://ultimate-sports-ai-backend-production.up.railway.app',
    WS_URL: 'wss://ultimate-sports-ai-backend-production.up.railway.app',
    WS_FALLBACK: 'ws://localhost:3001',
    PAYPAL_CLIENT_ID: 'YOUR_PAYPAL_CLIENT_ID',
    VERSION: '4.1.0',
    REQUEST_TIMEOUT: 15000
};

// ============================================
// STATE MANAGEMENT
// ============================================

class AppState {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.currentPage = 'home';
        this.listeners = [];
    }

    setUser(user) {
        this.user = user;
        this.isAuthenticated = !!user;
        this.notify();
    }

    clearUser() {
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem('auth_token');
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this));
    }
}

const appState = new AppState();

// ============================================
// API SERVICE
// ============================================

class APIService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.workingEndpoint = null;
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = localStorage.getItem('auth_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    async tryEndpoint(endpoint, url, options) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

            const response = await fetch(`${url}${endpoint}`, {
                ...options,
                headers: this.getHeaders(),
                signal: controller.signal,
                credentials: 'include'
            });

            clearTimeout(timeoutId);
            
            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('Invalid response from server');
            }

            if (!response.ok) {
                throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
            }

            return { success: true, data };
        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, error: 'timeout' };
            }
            return { success: false, error: error.message };
        }
    }

    async request(endpoint, options = {}) {
        try {
            if (this.workingEndpoint) {
                const result = await this.tryEndpoint(endpoint, this.workingEndpoint, options);
                if (result.success) {
                    return result.data;
                }
                this.workingEndpoint = null;
            }

            for (const baseUrl of CONFIG.API_ENDPOINTS) {
                console.log(`🔄 Trying endpoint: ${baseUrl}${endpoint}`);
                const result = await this.tryEndpoint(endpoint, baseUrl, options);
                
                if (result.success) {
                    this.workingEndpoint = baseUrl;
                    console.log(`✅ Connected to: ${baseUrl}`);
                    return result.data;
                }
                console.warn(`⚠️ Failed ${baseUrl}: ${result.error}`);
            }

            throw new Error('Unable to connect to backend - please check your internet connection and try again');
        } catch (error) {
            console.error('❌ API Error:', error.message);
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

    async logout() {
        return this.request('/api/auth/logout', {
            method: 'POST'
        });
    }

    getOAuthURL(provider) {
        return `${this.baseURL}/api/auth/${provider}`;
    }

    async getLiveScores() {
        return this.request('/api/scores/live');
    }

    async getAIPredictions(gameId) {
        return this.request(`/api/ai/predictions/${gameId}`);
    }

    async getUserAnalytics() {
        return {
            picks: 0,
            wins: 0,
            accuracy: 0,
            streak: 0
        };
    }

    async createSubscription(tier) {
        return this.request('/api/payments/subscribe', {
            method: 'POST',
            body: JSON.stringify({ tier })
        });
    }

    async cancelSubscription() {
        return this.request('/api/payments/cancel', {
            method: 'POST'
        });
    }

    async getUserProfile() {
        return this.request('/api/users/profile');
    }

    async getUserStats() {
        return this.request('/api/users/stats');
    }

    async updateUserProfile(username, avatar) {
        return this.request('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify({ username, avatar })
        });
    }

    async walletTransaction(type, amount, reason, metadata = {}) {
        return this.request('/api/users/me/wallet/transaction', {
            method: 'POST',
            body: JSON.stringify({ type, amount, reason, metadata })
        });
    }

    async getTransactionHistory(limit = 50, offset = 0) {
        return this.request(`/api/users/me/wallet/transactions?limit=${limit}&offset=${offset}`);
    }

    async getTournaments() {
        return this.request('/api/tournaments');
    }

    async joinTournament(tournamentId) {
        return this.request(`/api/tournaments/${tournamentId}/join`, {
            method: 'POST'
        });
    }

    async getUserTournaments() {
        return this.request('/api/users/me/tournaments');
    }

    async startGame(gameType, wager) {
        return this.request('/api/games/start', {
            method: 'POST',
            body: JSON.stringify({ gameType, wager })
        });
    }

    async submitGameResult(gameId, outcome, score = null, multiplier = 2) {
        return this.request(`/api/games/${gameId}/result`, {
            method: 'POST',
            body: JSON.stringify({ outcome, score, multiplier })
        });
    }

    async getGameStats() {
        return this.request('/api/users/me/games/stats');
    }

    async getLeaderboardBalance(limit = 100) {
        return this.request(`/api/leaderboards/balance?limit=${limit}`);
    }

    async getLeaderboardTournaments(limit = 100) {
        return this.request(`/api/leaderboards/tournaments?limit=${limit}`);
    }

    async hasSufficientBalance(amount) {
        try {
            const profile = await this.getUserProfile();
            return profile.user.balance >= amount;
        } catch (error) {
            console.error('Error checking balance:', error);
            return false;
        }
    }

    async getBalance() {
        try {
            const profile = await this.getUserProfile();
            return profile.user.balance;
        } catch (error) {
            console.error('Error fetching balance:', error);
            return 0;
        }
    }
}

const api = new APIService();

// ============================================
// AUTH MANAGER
// ============================================

class AuthManager {
    constructor() {
        this.init();
    }

    async init() {
        const token = localStorage.getItem('auth_token');
        console.log('🔐 AuthManager init - Token exists:', !!token);
        
        if (token) {
            try {
                console.log('🔄 Verifying auth token...');
                const userResponse = await api.getCurrentUser();
                const user = userResponse.user || userResponse;
                appState.setUser(user);
                console.log('✅ User authenticated:', user.username || user.email);
            } catch (error) {
                console.error('⚠️ Auth check failed:', error.message);
                localStorage.removeItem('auth_token');
                console.log('ℹ️ Starting as guest user');
            }
        } else {
            console.log('ℹ️ No auth token - starting as guest user');
        }
    }

    async signup(email, password, name) {
        try {
            console.log('🔐 Attempting signup:', { email, username: name });
            const response = await api.signup(email, password, name);
            
            const token = response.accessToken;
            const user = response.user;
            
            if (!token || !user) {
                throw new Error('No authentication token or user data received');
            }
            
            localStorage.setItem('auth_token', token);
            appState.setUser(user);
            showToast('Account created successfully! 🎉', 'success');
            return true;
        } catch (error) {
            console.error('❌ Signup failed:', error);
            let errorMsg = error.message;
            
            if (errorMsg.includes('already exists')) {
                errorMsg = 'Email already registered. Try logging in or use a different email.';
            } else if (errorMsg.includes('password')) {
                errorMsg = 'Password must be at least 8 characters.';
            } else if (errorMsg.includes('Unable to connect')) {
                errorMsg = 'Connection failed. Please check your internet.';
            }
            
            showToast(errorMsg || 'Signup failed.', 'error');
            return false;
        }
    }

    async login(email, password) {
        try {
            console.log('🔐 Attempting login:', { email });
            const response = await api.login(email, password);
            
            if (response.requiresTwoFactor) {
                console.log('🔐 2FA required');
                showToast('Please enter your 2FA code', 'info');
                return false;
            }
            
            const token = response.accessToken;
            const user = response.user;
            
            if (!token || !user) {
                throw new Error('No authentication data received');
            }
            
            localStorage.setItem('auth_token', token);
            appState.setUser(user);
            showToast('Welcome back! 🎉', 'success');
            return true;
        } catch (error) {
            console.error('❌ Login failed:', error);
            let errorMsg = error.message;
            
            if (errorMsg.includes('not found')) {
                errorMsg = 'Email not found. Check or create a new account.';
            } else if (errorMsg.includes('password') || errorMsg.includes('incorrect')) {
                errorMsg = 'Invalid email or password.';
            } else if (errorMsg.includes('Unable to connect')) {
                errorMsg = 'Connection failed.';
            }
            
            showToast(errorMsg || 'Login failed.', 'error');
            return false;
        }
    }

    logout() {
        appState.clearUser();
        showToast('Logged out successfully', 'success');
        navigation.navigateTo('home');
    }

    async handleOAuthCallback() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (token) {
            localStorage.setItem('auth_token', token);
            window.history.replaceState({}, '', window.location.pathname);
            await this.init();
            showToast('Logged in successfully!', 'success');
        }
    }
}

const authManager = new AuthManager();
console.log('✅ authManager initialized');

// ============================================
// NAVIGATION
// ============================================

class Navigation {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        const menuBtn = document.getElementById('menu-btn');
        const drawer = document.getElementById('drawer-nav');
        const overlay = document.getElementById('drawer-overlay');

        menuBtn?.addEventListener('click', () => {
            drawer.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay?.addEventListener('click', () => {
            drawer.classList.remove('active');
            overlay.classList.remove('active');
        });

        document.querySelectorAll('.bottom-nav-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.navigateTo(page);
                
                document.querySelectorAll('.bottom-nav-item').forEach(b => 
                    b.classList.remove('active')
                );
                btn.classList.add('active');
            });
        });

        document.querySelectorAll('.menu-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.navigateTo(page);
                
                document.querySelectorAll('.menu-item').forEach(b => 
                    b.classList.remove('active')
                );
                btn.classList.add('active');
                
                drawer?.classList.remove('active');
                overlay?.classList.remove('active');
            });
        });

        document.querySelectorAll('.quick-action-card[data-page]').forEach(card => {
            card.addEventListener('click', () => {
                this.navigateTo(card.dataset.page);
            });
        });

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (appState.isAuthenticated) {
                authManager.logout();
            } else {
                this.navigateTo('auth');
            }
            drawer?.classList.remove('active');
            overlay?.classList.remove('active');
        });

        document.getElementById('upgrade-btn')?.addEventListener('click', () => {
            this.navigateTo('subscription');
            drawer?.classList.remove('active');
            overlay?.classList.remove('active');
        });

        console.log('✅ Navigation initialized');
    }

    navigateTo(page) {
        console.log(`📍 Navigate to: ${page}`);

        document.querySelectorAll('.page').forEach(p => 
            p.classList.remove('active')
        );

        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
            
            if (window.breadcrumbManager) {
                window.breadcrumbManager.update(page);
            }
            
            if (page === 'auth' && typeof window.reinitAuthForm === 'function') {
                setTimeout(() => window.reinitAuthForm(), 100);
            }
            
            if (page === 'profile' && typeof window.reinitProfile === 'function') {
                setTimeout(() => window.reinitProfile(), 100);
            }
            window.scrollTo(0, 0);
            this.loadPageData(page);
        }
    }

    showAuthPage() {
        document.querySelectorAll('.page').forEach(p => 
            p.classList.remove('active')
        );
        document.getElementById('auth-page')?.classList.add('active');
    }

    async loadIframePage(pageName, htmlFile) {
        const container = document.getElementById(`${pageName}-page`);
        if (!container) return;

        let iframe = container.querySelector('iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.src = htmlFile;
            iframe.style.width = '100%';
            iframe.style.height = 'calc(100vh - 120px)';
            iframe.style.border = 'none';
            iframe.style.display = 'block';
            iframe.title = pageName;
            container.appendChild(iframe);
        }
    }

    async loadPageData(page) {
        switch(page) {
            case 'live-scores':
                if (typeof liveScoresManager !== 'undefined') {
                    await liveScoresManager.load();
                }
                break;
            case 'my-bets':
                await this.loadIframePage('my-bets', 'my-bets.html');
                break;
            case 'tournaments':
                await this.loadIframePage('tournaments', 'tournaments.html');
                break;
            case 'ai-coaches':
                if (typeof aiCoachesDeluxe !== 'undefined') {
                    aiCoachesDeluxe.render('ai-coaches-container');
                }
                break;
            case 'analytics':
                break;
            case 'profile':
                break;
            case 'subscription':
                if (typeof subscriptionManager !== 'undefined') {
                    await subscriptionManager.loadSubscriptionPage();
                }
                break;
            case 'settings':
                break;
        }
    }
}

const navigation = new Navigation();

// ============================================
// AUTH UI
// ============================================

class AuthUI {
    constructor() {
        this.init();
    }

    init() {
        document.getElementById('continue-as-guest-btn')?.addEventListener('click', () => {
            navigation.navigateTo('home');
        });

        const setupOAuthButton = (buttonId, provider) => {
            document.getElementById(buttonId)?.addEventListener('click', () => {
                window.location.href = api.getOAuthURL(provider);
            });
        };

        setupOAuthButton('google-login-btn', 'google');
        setupOAuthButton('google-signup-btn', 'google');
        setupOAuthButton('apple-login-btn', 'apple');
        setupOAuthButton('apple-signup-btn', 'apple');

        console.log('✅ Auth UI initialized');
    }
}

const authUI = new AuthUI();

// ============================================
// UI UPDATES
// ============================================

function updateUI() {
    const user = appState.user;
    const isAuthenticated = appState.isAuthenticated;
    const userTier = user?.subscription_tier || user?.subscription || 'FREE';

    const displayName = document.getElementById('user-display-name');
    const tierBadge = document.getElementById('user-tier-badge');
    const logoutBtn = document.getElementById('logout-btn');
    const upgradeBtn = document.getElem
