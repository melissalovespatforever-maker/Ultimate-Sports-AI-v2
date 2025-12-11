// ============================================
// ENHANCED DASHBOARD STATS
// Real-time, animated user statistics
// ============================================

class DashboardStats {
    constructor() {
        this.stats = {
            totalPicks: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            currentStreak: 0,
            bestStreak: 0,
            coinsEarned: 0,
            level: 1,
            xp: 0,
            accuracy: 0
        };
        
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        console.log('📊 Initializing enhanced dashboard stats...');
        await this.loadUserStats();
        this.renderDashboard();
        this.startRealTimeUpdates();
        this.initialized = true;
    }

    async loadUserStats() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.renderGuestStats();
                return;
            }

            // Fetch user profile with stats
            const response = await fetch(`${window.API_URL}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.stats = {
                    totalPicks: data.total_picks || 0,
                    wins: data.wins || 0,
                    losses: data.losses || 0,
                    winRate: data.win_rate || 0,
                    currentStreak: data.current_streak || 0,
                    bestStreak: data.best_streak || 0,
                    coinsEarned: data.coins || 0,
                    level: data.level || 1,
                    xp: data.xp || 0,
                    accuracy: data.accuracy || 0
                };
            } else {
                this.renderGuestStats();
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
            this.renderGuestStats();
        }
    }

    renderGuestStats() {
        this.stats = {
            totalPicks: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            currentStreak: 0,
            bestStreak: 0,
            coinsEarned: 1000, // Starting coins for guests
            level: 1,
            xp: 0,
            accuracy: 0
        };
    }

    renderDashboard() {
        const homePageContent = document.querySelector('#home-page .page-content');
        if (!homePageContent) return;

        // Find existing stats section and replace it
        const existingHero = homePageContent.querySelector('.dashboard-hero');
        if (existingHero) {
            existingHero.remove();
        }

        const existingStats = homePageContent.querySelector('.stats-grid');
        if (existingStats) {
            const parent = existingStats.parentElement;
            parent.innerHTML = this.getEnhancedStatsHTML();
        } else {
            // Insert at the beginning
            homePageContent.insertAdjacentHTML('afterbegin', this.getEnhancedStatsHTML());
        }

        // Animate stats on load
        setTimeout(() => this.animateCounters(), 100);
        setTimeout(() => this.renderPerformanceGauge(), 200);
    }

    getEnhancedStatsHTML() {
        const user = window.currentUser || { username: 'Guest', level: 1 };
        const greeting = this.getGreeting();
        
        return `
            <!-- Dashboard Hero -->
            <div class="dashboard-hero">
                <div class="dashboard-hero-content">
                    <h2 class="dashboard-greeting">${greeting}, ${user.username}! 👋</h2>
                    <p class="dashboard-subtitle">Here's your performance today</p>
                    
                    <div class="quick-stats-inline">
                        <div class="quick-stat-item">
                            <div class="quick-stat-icon">💰</div>
                            <div class="quick-stat-info">
                                <h4 id="quick-coins">${this.formatNumber(this.stats.coinsEarned)}</h4>
                                <p>Coins</p>
                            </div>
                        </div>
                        <div class="quick-stat-item">
                            <div class="quick-stat-icon">⭐</div>
                            <div class="quick-stat-info">
                                <h4 id="quick-level">${user.level}</h4>
                                <p>Level</p>
                            </div>
                        </div>
                        <div class="quick-stat-item">
                            <div class="quick-stat-icon">🔥</div>
                            <div class="quick-stat-info">
                                <h4 id="quick-streak">${this.stats.currentStreak}</h4>
                                <p>Streak</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Stats Grid -->
            <div class="stats-grid-enhanced">
                ${this.getStatCard('Total Picks', this.stats.totalPicks, '📊', 'neutral', `${this.stats.wins}W / ${this.stats.losses}L`)}
                ${this.getStatCard('Win Rate', `${this.stats.winRate.toFixed(1)}%`, '🎯', this.getTrend(this.stats.winRate, 50), null, this.stats.winRate)}
                ${this.getStatCard('Best Streak', this.stats.bestStreak, '🏆', 'up', 'Personal Best')}
                ${this.getStatCard('Accuracy', `${this.stats.accuracy.toFixed(1)}%`, '💯', this.getTrend(this.stats.accuracy, 60), null, this.stats.accuracy)}
            </div>

            <!-- Performance Meter -->
            <div class="performance-meter">
                <div class="performance-meter-header">
                    <h3 class="performance-meter-title">Overall Performance</h3>
                    <div class="performance-score" id="performance-score">0</div>
                </div>
                <div class="performance-gauge" id="performance-gauge">
                    <svg width="200" height="120" viewBox="0 0 200 120" class="gauge-svg">
                        <defs>
                            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <path class="gauge-background" d="M 20 100 A 80 80 0 0 1 180 100" stroke-width="12"/>
                        <path class="gauge-progress" id="gauge-progress" d="M 20 100 A 80 80 0 0 1 180 100" stroke-width="12" stroke-dasharray="251.2" stroke-dashoffset="251.2"/>
                    </svg>
                </div>
                <div class="performance-labels">
                    <div class="performance-label">
                        <div class="performance-label-value">${this.stats.wins}</div>
                        <div class="performance-label-text">Wins</div>
                    </div>
                    <div class="performance-label">
                        <div class="performance-label-value">${this.stats.totalPicks}</div>
                        <div class="performance-label-text">Total Picks</div>
                    </div>
                    <div class="performance-label">
                        <div class="performance-label-value">${this.stats.losses}</div>
                        <div class="performance-label-text">Losses</div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatCard(label, value, icon, trend, detail = null, progress = null) {
        const trendHTML = trend !== 'neutral' ? `
            <div class="stat-card-trend ${trend}">
                <i class="fas fa-arrow-${trend === 'up' ? 'up' : 'down'}"></i>
                ${trend === 'up' ? 'Good' : 'Needs Work'}
            </div>
        ` : '';

        const detailHTML = detail ? `
            <div class="stat-card-detail">
                <span>${detail}</span>
            </div>
        ` : '';

        const progressHTML = progress !== null ? `
            <div class="stat-progress">
                <div class="stat-progress-bar" style="width: ${Math.min(progress, 100)}%"></div>
            </div>
        ` : '';

        return `
            <div class="stat-card-enhanced">
                <div class="stat-card-header">
                    <div class="stat-card-icon">${icon}</div>
                    ${trendHTML}
                </div>
                <div class="stat-card-value">${value}</div>
                <div class="stat-card-label">${label}</div>
                ${progressHTML}
                ${detailHTML}
            </div>
        `;
    }

    getTrend(value, threshold) {
        if (value >= threshold) return 'up';
        if (value < threshold * 0.7) return 'down';
        return 'neutral';
    }

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    animateCounters() {
        // Animate all counter elements
        const counters = document.querySelectorAll('.stat-card-value, .performance-label-value, .quick-stat-info h4');
        counters.forEach(counter => {
            const target = counter.textContent;
            if (!target.match(/\d/)) return; // Skip non-numeric

            const numericValue = parseInt(target.replace(/[^\d]/g, ''));
            if (isNaN(numericValue)) return;

            this.animateValue(counter, 0, numericValue, 1000);
        });
    }

    animateValue(element, start, end, duration) {
        const startTime = Date.now();
        const originalText = element.textContent;
        const suffix = originalText.replace(/[\d.]/g, '');

        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            const current = Math.floor(start + (end - start) * easeOut);
            
            element.textContent = current + suffix;

            if (progress >= 1) {
                clearInterval(timer);
                element.textContent = end + suffix;
            }
        }, 16);
    }

    renderPerformanceGauge() {
        const gauge = document.getElementById('gauge-progress');
        const scoreElement = document.getElementById('performance-score');
        
        if (!gauge || !scoreElement) return;

        // Calculate performance score (0-100)
        const score = Math.round((this.stats.wins / Math.max(this.stats.totalPicks, 1)) * 100) || 0;
        
        // Animate gauge
        const circumference = 251.2;
        const offset = circumference - (score / 100) * circumference;
        
        setTimeout(() => {
            gauge.style.strokeDashoffset = offset;
        }, 100);

        // Animate score
        this.animateValue(scoreElement, 0, score, 1500);
    }

    startRealTimeUpdates() {
        // Update stats every 30 seconds
        setInterval(() => {
            this.loadUserStats().then(() => {
                this.updateStatsInPlace();
            });
        }, 30000);
    }

    updateStatsInPlace() {
        // Update existing elements without re-rendering
        const quickCoins = document.getElementById('quick-coins');
        const quickLevel = document.getElementById('quick-level');
        const quickStreak = document.getElementById('quick-streak');

        if (quickCoins) quickCoins.textContent = this.formatNumber(this.stats.coinsEarned);
        if (quickLevel) quickLevel.textContent = this.stats.level;
        if (quickStreak) quickStreak.textContent = this.stats.currentStreak;

        // Update performance gauge
        this.renderPerformanceGauge();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboardStats = new DashboardStats();
    });
} else {
    window.dashboardStats = new DashboardStats();
}

// Auto-initialize when user logs in or page loads
window.addEventListener('userLoggedIn', () => {
    if (window.dashboardStats) {
        window.dashboardStats.init();
    }
});

window.addEventListener('load', () => {
    if (window.dashboardStats && document.getElementById('home-page')) {
        window.dashboardStats.init();
    }
});
