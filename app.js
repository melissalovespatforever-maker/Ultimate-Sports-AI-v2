// ============================================
// ULTIMATE SPORTS AI - CLEAN APP
// Production-ready frontend connecting to Railway backend
// ============================================

console.log('🚀 Ultimate Sports AI v4.0 - Clean Build');

// Add diagnostic function for debugging
window.diagnoseConnection = async function() {
    console.log('🔍 Running connection diagnostics...');
    const endpoints = [
        'https://ultimate-sports-ai-backend-production.up.railway.app',
        'http://localhost:3001',
        '/api'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${endpoint}/api/health`);
            const response = await fetch(`${endpoint}/api/health`, { signal: AbortSignal.timeout(5000) });
            if (response.ok) {
                console.log(`✅ ${endpoint} - WORKING`);
            } else {
                console.warn(`⚠️ ${endpoint} - HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn(`❌ ${endpoint} - ${error.message}`);
        }
    }
    console.log('Diagnostics complete!');
};

// CRITICAL: Force loader removal after 1.5 seconds max
const forceRemoveLoader = () => {
    const loader = document.getElementById('app-loader');
    if (loader) {
        console.log('✅ Force removing loader after timeout');
        loader.style.display = 'none';
        loader.remove();
    }
};

setTimeout(forceRemoveLoader, 1500);

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // Backend API URLs - Multiple fallback options
    API_ENDPOINTS: [
        'https://ultimate-sports-ai-backend-production.up.railway.app',
        'http://localhost:3001',
        '/api' // Same-origin fallback
    ],
    API_BASE_URL: 'https://ultimate-sports-ai-backend-production.up.railway.app',
    // For local development: API_BASE_URL: 'http://localhost:3001',
    
    WS_URL: 'wss://ultimate-sports-ai-backend-production.up.railway.app',
    WS_FALLBACK: 'ws://localhost:3001',
    PAYPAL_CLIENT_ID: 'YOUR_PAYPAL_CLIENT_ID',
    VERSION: '4.0.0',
    REQUEST_TIMEOUT: 15000 // 15 second timeout
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
            // Try working endpoint first if we have one
            if (this.workingEndpoint) {
                const result = await this.tryEndpoint(endpoint, this.workingEndpoint, options);
                if (result.success) {
                    return result.data;
                }
                // If it fails, clear it and try all endpoints
                this.workingEndpoint = null;
            }

            // Try all configured endpoints
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

            // If all endpoints fail
            throw new Error('Unable to connect to backend - please check your internet connection and try again');
        } catch (error) {
            console.error('❌ API Error:', error.message);
            throw error;
        }
    }

    // Auth endpoints
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

    // OAuth endpoints
    getOAuthURL(provider) {
        return `${this.baseURL}/api/auth/${provider}`;
    }

    // Live scores
    async getLiveScores() {
        return this.request('/api/scores/live');
    }

    // AI Coaches
    async getAIPredictions(gameId) {
        return this.request(`/api/ai/predictions/${gameId}`);
    }

    // User analytics - Client-side only (no backend call)
    async getUserAnalytics() {
        // Return empty analytics object - no backend endpoint needed
        // All analytics are tracked client-side via analytics-tracker.js
        return {
            picks: 0,
            wins: 0,
            accuracy: 0,
            streak: 0
        };
    }

    // Subscription
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

    // ============================================
    // SECURE USER PROFILE & WALLET METHODS
    // ============================================

    async getUserProfile() {
        // Returns current authenticated user profile
        return this.request('/api/users/profile');
    }

    async getUserStats() {
        // Returns current authenticated user stats
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

    // ============================================
    // SECURE TOURNAMENT METHODS
    // ============================================

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

    // ============================================
    // SECURE MINI-GAMES METHODS
    // ============================================

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

    // ============================================
    // SECURE LEADERBOARD METHODS
    // ============================================

    async getLeaderboardBalance(limit = 100) {
        return this.request(`/api/leaderboards/balance?limit=${limit}`);
    }

    async getLeaderboardTournaments(limit = 100) {
        return this.request(`/api/leaderboards/tournaments?limit=${limit}`);
    }

    // ============================================
    // HELPER METHODS
    // ============================================

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
                console.log('📦 API Response structure:', Object.keys(userResponse));
                
                // API returns { user: {...} } - extract the user object
                const user = userResponse.user || userResponse;
                appState.setUser(user);
                console.log('✅ User authenticated:', user.username || user.email);
            } catch (error) {
                console.error('⚠️ Auth check failed:', error.message);
                // Clear invalid token
                localStorage.removeItem('auth_token');
                console.log('ℹ️ Starting as guest user');
            }
        } else {
            console.log('ℹ️ No auth token - starting as guest user (full access to app)');
        }
    }

    async signup(email, password, name) {
        try {
            console.log('🔐 Attempting signup:', { email, username: name });
            const response = await api.signup(email, password, name);
            console.log('📦 Signup response structure:', Object.keys(response));
            console.log('✅ Signup successful:', response);
            
            // Backend returns { user: {...}, accessToken: "jwt..." }
            const token = response.accessToken;
            const user = response.user;
            
            if (!token) {
                console.error('❌ No access token in signup response');
                throw new Error('No authentication token received');
            }
            
            if (!user) {
                console.error('❌ No user data in signup response');
                throw new Error('No user data received');
            }
            
            // Store token and update state
            localStorage.setItem('auth_token', token);
            appState.setUser(user);
            console.log('✅ Token stored and user authenticated');
            
            showToast('Account created successfully! 🎉', 'success');
            return true;
        } catch (error) {
            console.error('❌ Signup failed:', error);
            let errorMsg = error.message;
            
            // Parse specific error messages
            if (errorMsg.includes('already exists')) {
                errorMsg = 'Email already registered. Try logging in or use a different email.';
            } else if (errorMsg.includes('password')) {
                errorMsg = 'Password must be at least 8 characters with uppercase, lowercase, and numbers.';
            } else if (errorMsg.includes('Unable to connect')) {
                errorMsg = 'Connection failed. Please check your internet and try again.';
            } else if (errorMsg.includes('timeout')) {
                errorMsg = 'Request timed out. Please try again.';
            }
            
            showToast(errorMsg || 'Signup failed. Please try again.', 'error');
            return false;
        }
    }

    async login(email, password) {
        try {
            console.log('🔐 Attempting login:', { email });
            const response = await api.login(email, password);
            console.log('📦 Login response structure:', Object.keys(response));
            
            // Check if 2FA is required
            if (response.requiresTwoFactor) {
                console.log('🔐 2FA required for this account');
                showToast('Please enter your 2FA code', 'info');
                // Open 2FA verification modal
                if (window.twoFactorManager) {
                    window.twoFactorManager.openVerifyModal({
                        userId: response.userId,
                        email: response.email
                    });
                }
                return false; // Don't complete login yet
            }
            
            console.log('✅ Login successful:', response);
            
            // Backend returns { user: {...}, accessToken: "jwt..." }
            const token = response.accessToken;
            const user = response.user;
            
            if (!token) {
                console.error('❌ No access token in login response');
                throw new Error('No authentication token received');
            }
            
            if (!user) {
                console.error('❌ No user data in login response');
                throw new Error('No user data received');
            }
            
            // Store token and update state
            localStorage.setItem('auth_token', token);
            appState.setUser(user);
            console.log('✅ Token stored and user authenticated:', user.username || user.email);
            
            showToast('Welcome back! 🎉', 'success');
            return true;
        } catch (error) {
            console.error('❌ Login failed:', error);
            let errorMsg = error.message;
            
            // Parse specific error messages
            if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
                errorMsg = 'Email not found. Check your email or create a new account.';
            } else if (errorMsg.includes('password') || errorMsg.includes('incorrect')) {
                errorMsg = 'Invalid email or password. Please try again.';
            } else if (errorMsg.includes('Unable to connect')) {
                errorMsg = 'Connection failed. Please check your internet and try again.';
            } else if (errorMsg.includes('timeout')) {
                errorMsg = 'Request timed out. Please try again.';
            }
            
            showToast(errorMsg || 'Login failed. Please try again.', 'error');
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

// Make sure initApp is called
console.log('✅ authManager initialized, waiting for DOMContentLoaded...');

// ============================================
// NAVIGATION
// ============================================

class Navigation {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        // Drawer toggle
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

        // Bottom nav buttons
        document.querySelectorAll('.bottom-nav-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.navigateTo(page);
                
                // Update active state
                document.querySelectorAll('.bottom-nav-item').forEach(b => 
                    b.classList.remove('active')
                );
                btn.classList.add('active');
            });
        });

        // Drawer menu buttons
        document.querySelectorAll('.menu-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.navigateTo(page);
                
                // Update active state
                document.querySelectorAll('.menu-item').forEach(b => 
                    b.classList.remove('active')
                );
                btn.classList.add('active');
                
                // Close drawer
                drawer?.classList.remove('active');
                overlay?.classList.remove('active');
            });
        });

        // Quick action cards
        document.querySelectorAll('.quick-action-card[data-page]').forEach(card => {
            card.addEventListener('click', () => {
                this.navigateTo(card.dataset.page);
            });
       
