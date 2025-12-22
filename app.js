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

// Emergency loader removal - in case initialization fails
setTimeout(() => {
    const loader = document.getElementById('app-loader');
    if (loader) {
        console.warn('⚠️ Emergency loader removal triggered after 2 seconds');
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            loader.style.display = 'none';
            if (loader.parentElement) {
                loader.remove();
            }
        }, 300);
    }
}, 2000); // Remove after 2 seconds max

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
        });

        // Logout/Sign In button (dynamic based on auth state)
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (appState.isAuthenticated) {
                authManager.logout();
            } else {
                this.navigateTo('auth');
            }
            drawer?.classList.remove('active');
            overlay?.classList.remove('active');
        });

        // Upgrade button in drawer
        document.getElementById('upgrade-btn')?.addEventListener('click', () => {
            this.navigateTo('subscription');
            drawer?.classList.remove('active');
            overlay?.classList.remove('active');
        });

        console.log('✅ Navigation initialized');
    }

    navigateTo(page) {
        console.log(`📍 Navigate to: ${page}`);

        // Allow access to all pages - no auth required
        // Premium features will show upgrade prompts instead

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => 
            p.classList.remove('active')
        );

        // Show target page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
            
            // Update breadcrumb navigation
            if (window.breadcrumbManager) {
                window.breadcrumbManager.update(page);
            }
            
            // Reinitialize auth form when navigating to auth page
            if (page === 'auth' && typeof window.reinitAuthForm === 'function') {
                console.log('🔄 Reinitializing auth form');
                setTimeout(() => window.reinitAuthForm(), 100);
            }
            
            // Reinitialize profile when navigating to profile page
            if (page === 'profile' && typeof window.reinitProfile === 'function') {
                console.log('🔄 Reinitializing profile');
                setTimeout(() => window.reinitProfile(), 100);
            }
            window.scrollTo(0, 0);

            // Load page-specific data
            this.loadPageData(page);
        } else {
            console.error(`❌ Page not found: ${page}`);
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

        // Check if iframe already exists
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
                await liveScoresModule.load();
                break;
            case 'my-bets':
                await this.loadIframePage('my-bets', 'my-bets.html');
                break;
            case 'tournaments':
                await this.loadIframePage('tournaments', 'tournaments.html');
                break;
            case 'ai-coaches':
                await aiCoachesModule.load();
                break;
            case 'analytics':
                await analyticsModule.load();
                break;
            case 'profile':
                await profileModule.load();
                break;
            case 'subscription':
                if (typeof subscriptionManager !== 'undefined') {
                    await subscriptionManager.loadSubscriptionPage();
                }
                break;
            case 'settings':
                await settingsModule.load();
                break;
        }
    }
}

const navigation = new Navigation();

// ============================================
// AUTH UI (OAuth only - form handling in auth.js)
// ============================================

class AuthUI {
    constructor() {
        this.init();
    }

    init() {
        // Continue as Guest button
        document.getElementById('continue-as-guest-btn')?.addEventListener('click', () => {
            navigation.navigateTo('home');
        });

        // OAuth buttons
        const setupOAuthButton = (buttonId, provider) => {
            document.getElementById(buttonId)?.addEventListener('click', () => {
                window.location.href = api.getOAuthURL(provider);
            });
        };

        setupOAuthButton('google-login-btn', 'google');
        setupOAuthButton('google-signup-btn', 'google');
        setupOAuthButton('apple-login-btn', 'apple');
        setupOAuthButton('apple-signup-btn', 'apple');

        console.log('✅ Auth UI (OAuth + Guest) initialized');
    }
}

const authUI = new AuthUI();

// ============================================
// LIVE SCORES MODULE (loads external live-scores.js)
// ============================================

const liveScoresModule = {
    async load() {
        // Use the external LiveScoresManager if available
        if (typeof liveScoresManager !== 'undefined') {
            await liveScoresManager.load();
        } else {
            // Fallback if module not loaded
            console.warn('⚠️ Live scores manager not loaded, using fallback');
            this.loadFallback();
        }
    },

    loadFallback() {
        const container = document.getElementById('live-scores-container');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 60px 24px;">
                <div style="font-size: 64px; margin-bottom: 24px;">⚽🏀🏈</div>
                <h2 style="margin-bottom: 12px;">Live Scores</h2>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">
                    Real-time scores from ESPN loading...
                </p>
                <p style="color: var(--text-muted); font-size: 14px;">
                    Make sure live-scores.js is loaded in index.html
                </p>
            </div>
        `;
    }
};

// ============================================
// AI COACHES MODULE - WITH REAL PREDICTIONS
// ============================================

const aiCoachesModule = {
    async load() {
        const container = document.getElementById('ai-coaches-container');
        if (!container) return;

        // Use the deluxe AI coaches system
        if (typeof aiCoachesDeluxe !== 'undefined') {
            aiCoachesDeluxe.render('ai-coaches-container');
        } else {
            container.innerHTML = '<p class="error">AI Coaches module not loaded</p>';
        }
    },

    showPredictions(coachId) {
        if (typeof aiCoachesDeluxe !== 'undefined') {
            aiCoachesDeluxe.viewPicks(coachId);
        }
    },

    showNoGames(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 24px;">
                <div style="font-size: 64px; margin-bottom: 24px;">🤖</div>
                <h2 style="margin-bottom: 12px;">No Games Available</h2>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">
                    Check back when there are upcoming games to get AI predictions
                </p>
                <button class="btn btn-primary" onclick="navigation.navigateTo('live-scores')">
                    View Live Scores
                </button>
            </div>
        `;
    },

    showError(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: var(--text-secondary);">Failed to load AI predictions</p>
                <button class="btn btn-secondary" onclick="aiCoachesModule.load()">
                    Retry
                </button>
            </div>
        `;
    }
};

// ============================================
// ANALYTICS MODULE
// ============================================

const analyticsModule = {
    async load() {
        const container = document.getElementById('analytics-container');
        if (!container) return;

        try {
            container.innerHTML = '<p class="loading-text">Loading analytics...</p>';
            const analytics = await api.getUserAnalytics();
            this.render(analytics, container);
        } catch (error) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p style="color: var(--text-secondary);">Start making picks to see your analytics</p>
                </div>
            `;
        }
    },

    render(analytics, container) {
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-info">
                        <h4>${analytics.totalPicks || 0}</h4>
                        <p>Total Picks</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-percentage"></i></div>
                    <div class="stat-info">
                        <h4>${analytics.winRate || 0}%</h4>
                        <p>Win Rate</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-fire"></i></div>
                    <div class="stat-info">
                        <h4>${analytics.streak || 0}</h4>
                        <p>Current Streak</p>
                    </div>
                </div>
            </div>
        `;
    }
};

// ============================================
// PROFILE MODULE
// ============================================

const profileModule = {
    async load() {
        const container = document.getElementById('profile-container');
        if (!container) return;

        // Get user data (authenticated or guest)
        const user = appState.user || this.getGuestUserData();
        const tierRestrictions = window.tierRestrictions || null;
        const userTier = user.subscription_tier || 'free';

        // Get game stats from localStorage
        const gameStats = this.aggregateGameStats();
        
        container.innerHTML = `
            <div class="profile-page-wrapper">
                <!-- Profile Header -->
                <div class="profile-header-card">
                    <div class="profile-header-left">
                        <div class="profile-avatar-large" id="profileAvatar">
                            ${this.getAvatarEmoji(user.avatar)}
                        </div>
                        <div class="profile-user-info">
                            <h1 id="profileName">${user.name || 'Guest User'}</h1>
                            <p class="profile-email" id="profileEmail">${user.email || 'guest@ultimatesports.ai'}</p>
                            <div class="profile-tier-badge tier-${userTier.toLowerCase()}">
                                <i class="fas fa-crown"></i> ${userTier.toUpperCase()} TIER
                            </div>
                        </div>
                    </div>
                    <div class="profile-header-right">
                        ${userTier === 'free' ? `
                            <button class="btn-upgrade" onclick="showUpgradePrompt('profile', 'Upgrade to unlock all features!')">
                                <i class="fas fa-rocket"></i> Upgrade Now
                            </button>
                        ` : ''}
                        <button class="btn-secondary" onclick="authManager.logout()">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="profile-stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                            <i class="fas fa-gamepad"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${gameStats.totalGames}</h3>
                            <p>Total Games</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${gameStats.totalWins}</h3>
                            <p>Wins</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
                            <i class="fas fa-coins"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${this.formatNumber(gameStats.balance)}</h3>
                            <p>Coin Balance</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a, #fee140);">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${gameStats.winRate}%</h3>
                            <p>Win Rate</p>
                        </div>
                    </div>
                </div>

                <!-- Tier Restrictions Info -->
                ${this.renderTierLimits(userTier, tierRestrictions)}

                <!-- Game Stats by Type -->
                <div class="game-stats-section">
                    <h2><i class="fas fa-chart-bar"></i> Game Statistics</h2>
                    <div class="game-stats-cards">
                        ${this.renderGameStats(gameStats.byGame)}
                    </div>
                </div>

                <!-- Achievements -->
                <div class="achievements-section">
                    <h2><i class="fas fa-medal"></i> Achievements</h2>
                    ${userTier === 'free' ? `
                        <div class="locked-feature">
                            <i class="fas fa-lock"></i>
                            <p>Unlock achievements with PRO or VIP tier</p>
                            <button class="btn-upgrade-small" onclick="showUpgradePrompt('achievements', 'Get PRO to track achievements!')">
                                Upgrade to PRO
                            </button>
                        </div>
                    ` : `
                        <div class="achievements-grid">
                            ${this.renderAchievements(gameStats)}
                        </div>
                    `}
                </div>

                <!-- Recent Activity -->
                <div class="activity-section">
                    <h2><i class="fas fa-history"></i> Recent Activity</h2>
                    <div class="activity-feed">
                        ${this.renderRecentGames(gameStats.recentGames)}
                    </div>
                </div>
            </div>
        `;

        this.attachProfileEventListeners();
    },

    getGuestUserData() {
        const savedUsername = localStorage.getItem('guestUsername') || 'Guest User';
        const savedAvatar = localStorage.getItem('guestAvatar') || '😊';
        
        return {
            name: savedUsername,
            email: 'guest@ultimatesports.ai',
            subscription_tier: 'free',
            avatar: savedAvatar
        };
    },

    aggregateGameStats() {
        const slotsStats = JSON.parse(localStorage.getItem('slotsStats')) || { gamesPlayed: 0, wins: 0 };
        const wheelStats = JSON.parse(localStorage.getItem('wheelStats')) || { spins: 0, wins: 0 };
        const coinflipStats = JSON.parse(localStorage.getItem('coinflipStats')) || { flips: 0, wins: 0 };
        const penaltyStats = JSON.parse(localStorage.getItem('penaltyStats')) || { games: 0, wins: 0 };
        const triviaStats = JSON.parse(localStorage.getItem('triviaStats')) || { games: 0, wins: 0 };
        // Check both possible balance keys (sportsLoungeBalance is the actual one used by games)
        const balance = parseInt(localStorage.getItem('sportsLoungeBalance')) || parseInt(localStorage.getItem('gameCoins')) || 1000;

        const totalGames = slotsStats.gamesPlayed + wheelStats.spins + coinflipStats.flips + 
                          penaltyStats.games + triviaStats.games;
        const totalWins = slotsStats.wins + wheelStats.wins + coinflipStats.wins + 
                         penaltyStats.wins + triviaStats.wins;
        const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

        return {
            totalGames,
            totalWins,
            balance,
            winRate,
            byGame: {
                slots: slotsStats,
                wheel: wheelStats,
                coinflip: coinflipStats,
                penalty: penaltyStats,
                trivia: triviaStats
            },
            recentGames: this.getRecentGames()
        };
    },

    getRecentGames() {
        const recent = JSON.parse(localStorage.getItem('recentGames')) || [];
        return recent.slice(0, 10);
    },

    renderGameStats(byGame) {
        const games = [
            { name: 'Lucky Slots', icon: '🎰', stats: byGame.slots, key: 'gamesPlayed' },
            { name: 'Prize Wheel', icon: '🎡', stats: byGame.wheel, key: 'spins' },
            { name: 'Coin Flip', icon: '🪙', stats: byGame.coinflip, key: 'flips' },
            { name: 'Penalty Shootout', icon: '⚽', stats: byGame.penalty, key: 'games' },
            { name: 'Sports Trivia', icon: '🧠', stats: byGame.trivia, key: 'games' }
        ];

        return games.map(game => {
            const played = game.stats[game.key] || 0;
            const wins = game.stats.wins || 0;
            const rate = played > 0 ? Math.round((wins / played) * 100) : 0;
            
            return `
                <div class="game-stat-card">
                    <div class="game-stat-icon">${game.icon}</div>
                    <h3>${game.name}</h3>
                    <div class="game-stat-numbers">
                        <div class="stat-item">
                            <span class="stat-value">${played}</span>
                            <span class="stat-label">Played</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${wins}</span>
                            <span class="stat-label">Wins</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${rate}%</span>
                            <span class="stat-label">Win Rate</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderTierLimits(tier, restrictions) {
        if (!restrictions) return '';
        
        const limits = restrictions.tierLimits[tier.toLowerCase()];
        if (!limits) return '';

        return `
            <div class="tier-limits-card">
                <h2><i class="fas fa-shield-alt"></i> Your Tier Limits</h2>
                <div class="limits-grid">
                    <div class="limit-item">
                        <i class="fas fa-gamepad"></i>
                        <span>Daily Games: <strong>${limits.maxDailyGames === Infinity ? 'Unlimited' : limits.maxDailyGames}</strong></span>
                    </div>
                    <div class="limit-item">
                        <i class="fas fa-coins"></i>
                        <span>Max Bet: <strong>${limits.maxBetAmount} coins</strong></span>
                    </div>
                    <div class="limit-item">
                        <i class="fas fa-trophy"></i>
                        <span>Games Access: <strong>${limits.gameAccess.length}/5 games</strong></span>
                    </div>
                    <div class="limit-item">
                        <i class="fas fa-comments"></i>
                        <span>Daily Chat: <strong>${limits.chatMessages === Infinity ? 'Unlimited' : limits.chatMessages} messages</strong></span>
                    </div>
                    <div class="limit-item">
                        <i class="fas fa-user-friends"></i>
                        <span>AI Coaches: <strong>${limits.maxCoachAccess}/11 available</strong></span>
                    </div>
                    <div class="limit-item">
                        <i class="fas fa-wallet"></i>
                        <span>Max Balance: <strong>${limits.maxCoins === Infinity ? 'Unlimited' : this.formatNumber(limits.maxCoins)}</strong></span>
                    </div>
                </div>
            </div>
        `;
    },

    renderAchievements(stats) {
        const achievements = [
            { id: 'first_win', name: 'First Victory', icon: '🎉', unlocked: stats.totalWins >= 1 },
            { id: 'win_streak', name: 'Hot Streak', icon: '🔥', unlocked: stats.totalWins >= 5 },
            { id: 'high_roller', name: 'High Roller', icon: '💎', unlocked: stats.balance >= 5000 },
            { id: 'game_master', name: 'Game Master', icon: '🎮', unlocked: stats.totalGames >= 50 },
            { id: 'lucky_player', name: 'Lucky Star', icon: '⭐', unlocked: stats.winRate >= 60 },
            { id: 'coin_collector', name: 'Coin Collector', icon: '🪙', unlocked: stats.balance >= 10000 }
        ];

        return achievements.map(ach => `
            <div class="achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-info">
                    <h4>${ach.name}</h4>
                    <p>${ach.unlocked ? 'Unlocked!' : 'Locked'}</p>
                </div>
                ${ach.unlocked ? '<i class="fas fa-check-circle achievement-check"></i>' : '<i class="fas fa-lock"></i>'}
            </div>
        `).join('');
    },

    renderRecentGames(games) {
        if (!games || games.length === 0) {
            return '<p class="no-data">No recent games yet. Start playing to see your history!</p>';
        }

        return games.map(game => `
            <div class="activity-item">
                <div class="activity-icon ${game.result === 'win' ? 'win' : 'loss'}">
                    ${game.result === 'win' ? '<i class="fas fa-trophy"></i>' : '<i class="fas fa-times"></i>'}
                </div>
                <div class="activity-details">
                    <h4>${game.gameName}</h4>
                    <p>${game.result === 'win' ? 'Won' : 'Lost'} ${game.amount} coins</p>
                </div>
                <div class="activity-time">
                    ${this.formatTimeAgo(game.timestamp)}
                </div>
            </div>
        `).join('');
    },

    getAvatarEmoji(avatar) {
        return avatar || '😊';
    },

    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    },

    formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    },

    attachProfileEventListeners() {
        // Add any interactive elements here
        console.log('✅ Profile page loaded with full stats integration');
    }
};

// ============================================
// SETTINGS MODULE
// ============================================

const settingsModule = {
    async load() {
        const container = document.getElementById('settings-container');
        if (!container) return;

        const user = appState.user || this.getGuestUserData();

        container.innerHTML = `
            <div class="settings-page-wrapper">
                
                <!-- Account Section -->
                <div class="settings-section">
                    <h2 class="settings-section-title">
                        <i class="fas fa-user"></i> Account Settings
                    </h2>
                    
                    <!-- Avatar Selector -->
                    <div class="settings-card">
                        <div class="settings-card-header">
                            <div class="settings-label-group">
                                <h3>Profile Avatar</h3>
                                <p class="settings-description">Choose an emoji to represent you</p>
                            </div>
                            <div class="current-avatar-display" id="current-avatar">
                                ${user.avatar || '😊'}
                            </div>
                        </div>
                        <div class="settings-avatar-grid" id="settings-avatar-grid">
                            ${this.renderAvatarOptions(user.avatar || '😊')}
                        </div>
                    </div>

                    <!-- Username -->
                    <div class="settings-card">
                        <div class="settings-label-group">
                            <label class="settings-label">Username</label>
                            <p class="settings-description">This is how others see you</p>
                        </div>
                        <div class="settings-input-group">
                            <input 
                                type="text" 
                                id="settings-username" 
                                class="settings-input"
                                value="${user.name || 'Guest User'}"
                                maxlength="20"
                            >
                            <button class="btn-settings-save" onclick="settingsModule.saveUsername()">
                                <i class="fas fa-check"></i> Save
                            </button>
                        </div>
                    </div>

                    <!-- Email (if authenticated) -->
                    ${user.email && user.email !== 'guest@ultimatesports.ai' ? `
                        <div class="settings-card">
                            <div class="settings-label-group">
                                <label class="settings-label">Email</label>
                                <p class="settings-description">Your account email</p>
                            </div>
                            <input 
                                type="email" 
                                class="settings-input"
                                value="${user.email}"
                                disabled
                            >
                            <p class="settings-helper">Email cannot be changed here. Contact support if needed.</p>
                        </div>
                    ` : ''}
                </div>

                <!-- Preferences Section -->
                <div class="settings-section">
                    <h2 class="settings-section-title">
                        <i class="fas fa-sliders-h"></i> Preferences
                    </h2>
                    
                    <div class="settings-card">
                        <div class="settings-toggle-group">
                            <div class="settings-label-group">
                                <label class="settings-label">Push Notifications</label>
                                <p class="settings-description">Get alerts for game updates</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="notifications-toggle" ${this.getSetting('notifications', true) ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-card">
                        <div class="settings-toggle-group">
                            <div class="settings-label-group">
                                <label class="settings-label">Sound Effects</label>
                                <p class="settings-description">Play sounds in games</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="sounds-toggle" ${this.getSetting('sounds', true) ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-card">
                        <div class="settings-toggle-group">
                            <div class="settings-label-group">
                                <label class="settings-label">Dark Mode</label>
                                <p class="settings-description">Always enabled for optimal experience</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked disabled>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Data Section -->
                <div class="settings-section">
                    <h2 class="settings-section-title">
                        <i class="fas fa-database"></i> Data & Privacy
                    </h2>
                    
                    <div class="settings-card">
                        <div class="settings-label-group">
                            <label class="settings-label">Clear Game History</label>
                            <p class="settings-description">Delete all game statistics and history</p>
                        </div>
                        <button class="btn-settings-danger" onclick="settingsModule.clearGameData()">
                            <i class="fas fa-trash"></i> Clear Data
                        </button>
                    </div>

                    <div class="settings-card">
                        <div class="settings-label-group">
                            <label class="settings-label">Reset Settings</label>
                            <p class="settings-description">Restore all settings to default</p>
                        </div>
                        <button class="btn-settings-danger" onclick="settingsModule.resetSettings()">
                            <i class="fas fa-undo"></i> Reset All
                        </button>
                    </div>
                </div>

                <!-- About Section -->
                <div class="settings-section">
                    <h2 class="settings-section-title">
                        <i class="fas fa-info-circle"></i> About
                    </h2>
                    
                    <div class="settings-card">
                        <div class="settings-info-grid">
                            <div class="settings-info-item">
                                <span class="settings-info-label">Version</span>
                                <span class="settings-info-value">${CONFIG.VERSION}</span>
                            </div>
                            <div class="settings-info-item">
                                <span class="settings-info-label">Account Type</span>
                                <span class="settings-info-value">${(user.subscription_tier || 'free').toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `;

        this.attachEventListeners();
    },

    getGuestUserData() {
        const savedUsername = localStorage.getItem('guestUsername') || 'Guest User';
        const savedAvatar = localStorage.getItem('guestAvatar') || '😊';
        
        return {
            name: savedUsername,
            email: 'guest@ultimatesports.ai',
            subscription_tier: 'free',
            avatar: savedAvatar
        };
    },

    renderAvatarOptions(currentAvatar) {
        const avatars = [
            '⚽', '🏀', '🏈', '⚾', '🎾', '🏐',
            '🏆', '🥇', '🎯', '🎮', '🔥', '⚡',
            '💎', '👑', '🌟', '💪', '🚀', '🎲',
            '😊', '😎', '🤩', '🥳', '🤑', '🤖'
        ];

        return avatars.map(emoji => `
            <div class="settings-avatar-option ${emoji === currentAvatar ? 'active' : ''}" 
                 data-emoji="${emoji}" 
                 onclick="settingsModule.selectAvatar('${emoji}')">
                ${emoji}
            </div>
        `).join('');
    },

    selectAvatar(emoji) {
        // Update active state
        document.querySelectorAll('.settings-avatar-option').forEach(opt => {
            opt.classList.remove('active');
        });
        event.target.classList.add('active');

        // Update preview
        const preview = document.getElementById('current-avatar');
        if (preview) {
            preview.textContent = emoji;
        }

        // Save immediately
        this.saveAvatar(emoji);
    },

    saveAvatar(emoji) {
        // Save to localStorage
        localStorage.setItem('guestAvatar', emoji);

        // Update appState
        if (!appState.user) {
            appState.user = {};
        }
        appState.user.avatar = emoji;
        appState.notify(); // Triggers UI updates everywhere

        showToast('Avatar updated! 🎉', 'success');
        console.log('✅ Avatar updated:', emoji);
    },

    saveUsername() {
        const input = document.getElementById('settings-username');
        let username = input?.value.trim() || '';

        if (username.length < 3) {
            showToast('Username must be at least 3 characters', 'error');
            return;
        }

        if (username.length > 20) {
            showToast('Username must be 20 characters or less', 'error');
            return;
        }

        // Clean username
        username = username.replace(/[^a-zA-Z0-9_]/g, '');

        // Save to localStorage
        localStorage.setItem('guestUsername', username);

        // Update appState
        if (!appState.user) {
            appState.user = {};
        }
        appState.user.name = username;
        appState.notify();

        showToast('Username updated! ✅', 'success');
        console.log('✅ Username updated:', username);
    },

    getSetting(key, defaultValue = false) {
        const value = localStorage.getItem(`setting_${key}`);
        return value !== null ? value === 'true' : defaultValue;
    },

    saveSetting(key, value) {
        localStorage.setItem(`setting_${key}`, value.toString());
    },

    clearGameData() {
        if (!confirm('Are you sure? This will delete all your game statistics and cannot be undone.')) {
            return;
        }

        // Clear game stats
        localStorage.removeItem('slotsStats');
        localStorage.removeItem('wheelStats');
        localStorage.removeItem('coinflipStats');
        localStorage.removeItem('penaltyStats');
        localStorage.removeItem('triviaStats');
        localStorage.removeItem('recentGames');
        
        // Reset balance to default
        localStorage.setItem('sportsLoungeBalance', '1000');

        showToast('Game data cleared successfully', 'success');
        console.log('✅ Game data cleared');
    },

    resetSettings() {
        if (!confirm('Reset all settings to default? This will not affect your username or game data.')) {
            return;
        }

        // Remove all settings
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('setting_')) {
                localStorage.removeItem(key);
            }
        });

        showToast('Settings reset to default', 'success');
        
        // Reload settings page
        this.load();
    },

    attachEventListeners() {
        // Toggle switches
        const notificationsToggle = document.getElementById('notifications-toggle');
        const soundsToggle = document.getElementById('sounds-toggle');

        notificationsToggle?.addEventListener('change', (e) => {
            this.saveSetting('notifications', e.target.checked);
            showToast(`Notifications ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        soundsToggle?.addEventListener('change', (e) => {
            this.saveSetting('sounds', e.target.checked);
            showToast(`Sounds ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });

        console.log('✅ Settings page loaded');
    }
};

// ============================================
// UI UPDATES
// ============================================

function updateUI() {
    const user = appState.user;
    const isAuthenticated = appState.isAuthenticated;
    const userTier = user?.subscription_tier || user?.subscription || 'FREE';

    // Update user display
    const displayName = document.getElementById('user-display-name');
    const tierBadge = document.getElementById('user-tier-badge');
    const logoutBtn = document.getElementById('logout-btn');
    const upgradeBtn = document.getElementById('upgrade-btn');
    const drawerAvatar = document.getElementById('drawer-user-avatar');

    if (displayName) {
        displayName.textContent = user?.name || user?.username || 'Guest User';
    }

    if (tierBadge) {
        tierBadge.textContent = userTier.toUpperCase() + ' TIER';
        // Add tier-specific styling
        tierBadge.className = 'user-tier tier-' + userTier.toLowerCase();
    }

    // Update drawer avatar
    if (drawerAvatar) {
        const avatar = user?.avatar || localStorage.getItem('guestAvatar') || '😊';
        drawerAvatar.textContent = avatar;
    }

    // Update upgrade button based on tier
    if (upgradeBtn) {
        if (userTier.toLowerCase() === 'free') {
            upgradeBtn.style.display = 'block';
            upgradeBtn.innerHTML = '<i class="fas fa-crown"></i> Upgrade to PRO';
        } else if (userTier.toLowerCase() === 'pro') {
            upgradeBtn.style.display = 'block';
            upgradeBtn.innerHTML = '<i class="fas fa-gem"></i> Upgrade to VIP';
        } else {
            upgradeBtn.style.display = 'none'; // VIP users don't need upgrade
        }
    }

    // Show/hide logout button based on auth state
    if (logoutBtn) {
        if (isAuthenticated) {
            logoutBtn.style.display = 'flex';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Logout</span>';
        } else {
            logoutBtn.style.display = 'flex';
            logoutBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Sign In</span>';
            // Update click handler for guest users
            logoutBtn.onclick = () => navigation.navigateTo('auth');
        }
    }

    // Update stats on home page
    if (user?.stats) {
        document.getElementById('total-picks').textContent = user.stats.totalPicks || 0;
        document.getElementById('win-rate').textContent = `${user.stats.winRate || 0}%`;
        document.getElementById('current-streak').textContent = user.stats.streak || 0;
    }

    // Sync tier restrictions if available
    if (window.tierRestrictions && user) {
        window.tierRestrictions.setUserTier(userTier);
    }
}

// Subscribe to state changes
appState.subscribe(updateUI);

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}" style="color: var(--${type === 'success' ? 'success' : 'danger'});"></i>
            <span>${message}</span>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make showToast globally available
window.showToast = showToast;

// ============================================
// SUBSCRIPTION HANDLERS
// ============================================

document.getElementById('subscribe-pro-btn')?.addEventListener('click', async () => {
    if (!appState.isAuthenticated) {
        navigation.showAuthPage();
        showToast('Please log in to subscribe', 'error');
        return;
    }

    try {
        showToast('Redirecting to checkout...', 'info');
        const response = await api.createSubscription('PRO');
        if (response.checkoutUrl) {
            window.location.href = response.checkoutUrl;
        }
    } catch (error) {
        showToast('Failed to create subscription', 'error');
    }
});

document.getElementById('subscribe-vip-btn')?.addEventListener('click', async () => {
    if (!appState.isAuthenticated) {
        navigation.showAuthPage();
        showToast('Please log in to subscribe', 'error');
        return;
    }

    try {
        showToast('Redirecting to checkout...', 'info');
        const response = await api.createSubscription('VIP');
        if (response.checkoutUrl) {
            window.location.href = response.checkoutUrl;
        }
    } catch (error) {
        showToast('Failed to create subscription', 'error');
    }
});

// ============================================
// APP INITIALIZATION
// ============================================

async function initApp() {
    console.log('⚙️ Initializing Ultimate Sports AI...');

    try {
        // Load saved guest data if not authenticated
        if (!appState.isAuthenticated) {
            const savedUsername = localStorage.getItem('guestUsername');
            const savedAvatar = localStorage.getItem('guestAvatar');
            
            if (savedUsername || savedAvatar) {
                if (!appState.user) {
                    appState.user = {};
                }
                appState.user.name = savedUsername || 'Guest User';
                appState.user.avatar = savedAvatar || '😊';
                appState.user.subscription_tier = 'free';
                console.log('✅ Loaded guest data:', appState.user);
            }
        }

        // Initialize modules that were deferred (with timeout)
        setTimeout(() => {
            try {
                if (typeof initProfileManager === 'function') {
                    initProfileManager();
                }
                if (typeof initAuthFormHandler === 'function') {
                    initAuthFormHandler();
                }
            } catch (e) {
                console.warn('⚠️ Module initialization error:', e);
            }
        }, 100);

        // Check for OAuth callback
        if (authManager && authManager.handleOAuthCallback) {
            await authManager.handleOAuthCallback();
        }
    } catch (error) {
        console.error('⚠️ Initialization error:', error);
    }

    //
