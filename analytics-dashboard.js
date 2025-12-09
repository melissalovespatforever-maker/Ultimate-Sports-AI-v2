// ============================================
// ANALYTICS DASHBOARD CONTROLLER
// Visualize metrics and track conversions
// ============================================

console.log('📊 Loading Analytics Dashboard');

const dashboard = {
    charts: {},
    
    init() {
        console.log('📊 Initializing Analytics Dashboard');
        
        // Load data and render
        this.loadData();
        this.renderAll();
        
        // Auto-refresh every 30 seconds
        setInterval(() => this.refreshData(), 30000);
    },

    loadData() {
        if (!window.analyticsTracker) {
            console.error('❌ Analytics Tracker not loaded');
            return;
        }
        
        this.data = window.analyticsTracker.getSummaryReport();
        console.log('📊 Data loaded:', this.data);
    },

    refreshData() {
        console.log('🔄 Refreshing dashboard...');
        this.loadData();
        this.renderAll();
    },

    renderAll() {
        this.renderSummaryCards();
        this.renderUpgradeFunnel();
        this.renderGameLimits();
        this.renderCoachLocks();
        this.renderSources();
        this.renderUserBehavior();
        this.renderTierDistribution();
        this.renderTrends();
    },

    // ============================================
    // SUMMARY CARDS
    // ============================================

    renderSummaryCards() {
        const gameLimitHits = this.data.tierRestrictions.gameLimit.totalHits;
        const coachLockClicks = this.data.tierRestrictions.coachLock.totalClicks;
        const upgradePrompts = this.data.upgradeFunnel.promptsShown;
        const upgradeClicks = this.data.upgradeFunnel.promptClicks;
        const conversionRate = this.data.upgradeFunnel.conversionRate;

        document.getElementById('game-limit-hits').textContent = this.formatNumber(gameLimitHits);
        document.getElementById('coach-lock-clicks').textContent = this.formatNumber(coachLockClicks);
        document.getElementById('upgrade-prompts').textContent = `${this.formatNumber(upgradePrompts)} / ${this.formatNumber(upgradeClicks)}`;
        document.getElementById('conversion-rate').textContent = `${conversionRate}%`;
    },

    // ============================================
    // UPGRADE FUNNEL
    // ============================================

    renderUpgradeFunnel() {
        const funnel = this.data.upgradeFunnel;
        
        document.getElementById('funnel-prompts').textContent = this.formatNumber(funnel.promptsShown);
        document.getElementById('funnel-clicks').textContent = this.formatNumber(funnel.promptClicks);
        document.getElementById('funnel-visits').textContent = this.formatNumber(funnel.subscriptionVisits);
        document.getElementById('funnel-conversions').textContent = this.formatNumber(funnel.conversions);

        // Calculate rates
        const clickRate = funnel.promptsShown > 0 ? (funnel.promptClicks / funnel.promptsShown * 100).toFixed(1) : 0;
        const visitRate = funnel.promptClicks > 0 ? (funnel.subscriptionVisits / funnel.promptClicks * 100).toFixed(1) : 0;
        const conversionRate = funnel.subscriptionVisits > 0 ? (funnel.conversions / funnel.subscriptionVisits * 100).toFixed(1) : 0;

        document.getElementById('funnel-clicks-rate').textContent = `${clickRate}%`;
        document.getElementById('funnel-visits-rate').textContent = `${visitRate}%`;
        document.getElementById('funnel-conversion-rate').textContent = `${conversionRate}%`;

        // Visualize funnel
        this.renderFunnelVisualization(funnel);
    },

    renderFunnelVisualization(funnel) {
        const container = document.getElementById('funnel-viz');
        const maxWidth = 100;
        
        const stages = [
            { label: 'Prompts Shown', value: funnel.promptsShown, color: '#6366f1' },
            { label: 'Clicked', value: funnel.promptClicks, color: '#8b5cf6' },
            { label: 'Visited Page', value: funnel.subscriptionVisits, color: '#a855f7' },
            { label: 'Converted', value: funnel.conversions, color: '#fbbf24' }
        ];

        const maxValue = stages[0].value || 1;

        container.innerHTML = stages.map(stage => {
            const width = maxValue > 0 ? (stage.value / maxValue * maxWidth) : 0;
            const percentage = maxValue > 0 ? (stage.value / maxValue * 100).toFixed(1) : 0;
            
            return `
                <div class="funnel-stage">
                    <div class="funnel-label">
                        <span>${stage.label}</span>
                        <span class="funnel-count">${this.formatNumber(stage.value)} (${percentage}%)</span>
                    </div>
                    <div class="funnel-bar" style="width: ${width}%; background: ${stage.color};"></div>
                </div>
            `;
        }).join('');
    },

    // ============================================
    // GAME LIMITS CHART
    // ============================================

    renderGameLimits() {
        const stats = this.data.tierRestrictions.gameLimit;
        
        document.getElementById('game-limit-free').textContent = this.formatNumber(stats.byTier.free);
        document.getElementById('game-limit-pro').textContent = this.formatNumber(stats.byTier.pro);
        document.getElementById('game-limit-top').textContent = stats.topGame.name;

        // Chart
        const ctx = document.getElementById('game-limits-chart');
        if (this.charts.gameLimits) {
            this.charts.gameLimits.destroy();
        }

        const games = Object.keys(stats.byGame);
        const values = Object.values(stats.byGame);

        this.charts.gameLimits = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: games,
                datasets: [{
                    label: 'Limit Hits',
                    data: values,
                    backgroundColor: '#6366f1',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },

    // ============================================
    // COACH LOCKS CHART
    // ============================================

    renderCoachLocks() {
        const stats = this.data.tierRestrictions.coachLock;
        
        document.getElementById('coach-lock-free').textContent = this.formatNumber(stats.byTier.free);
        document.getElementById('coach-lock-pro').textContent = this.formatNumber(stats.byTier.pro);
        document.getElementById('coach-lock-top').textContent = stats.topCoach.name;

        // Chart
        const ctx = document.getElementById('coach-locks-chart');
        if (this.charts.coachLocks) {
            this.charts.coachLocks.destroy();
        }

        const coaches = Object.keys(stats.byCoach).slice(0, 10); // Top 10
        const values = coaches.map(coach => stats.byCoach[coach]);

        this.charts.coachLocks = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: coaches,
                datasets: [{
                    label: 'Lock Clicks',
                    data: values,
                    backgroundColor: '#ef4444',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },

    // ============================================
    // CONVERSION SOURCES
    // ============================================

    renderSources() {
        const sources = this.data.upgradeFunnel.bySource;
        
        // Game Limits
        document.getElementById('source-game-shown').textContent = this.formatNumber(sources.gameLimit.shown);
        document.getElementById('source-game-clicked').textContent = this.formatNumber(sources.gameLimit.clicked);
        document.getElementById('source-game-rate').textContent = sources.gameLimit.conversionRate + '%';

        // Coach Locks
        document.getElementById('source-coach-shown').textContent = this.formatNumber(sources.coachLock.shown);
        document.getElementById('source-coach-clicked').textContent = this.formatNumber(sources.coachLock.clicked);
        document.getElementById('source-coach-rate').textContent = sources.coachLock.conversionRate + '%';

        // Pie Chart
        const ctx = document.getElementById('sources-chart');
        if (this.charts.sources) {
            this.charts.sources.destroy();
        }

        this.charts.sources = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Game Limits', 'Coach Locks'],
                datasets: [{
                    data: [sources.gameLimit.clicked, sources.coachLock.clicked],
                    backgroundColor: ['#6366f1', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    // ============================================
    // USER BEHAVIOR
    // ============================================

    renderUserBehavior() {
        const behavior = this.data.userBehavior;
        const engagement = this.data.engagement;
        
        document.getElementById('behavior-games').textContent = this.formatNumber(behavior.gamesPlayed.total);
        document.getElementById('behavior-coaches').textContent = this.formatNumber(behavior.coachViews.total);
        document.getElementById('behavior-pageviews').textContent = this.formatNumber(engagement.pageViews);
        document.getElementById('behavior-sessions').textContent = this.formatNumber(engagement.sessions.total);
    },

    // ============================================
    // TIER DISTRIBUTION
    // ============================================

    renderTierDistribution() {
        const sessions = this.data.engagement.sessions.byTier;
        
        const ctx = document.getElementById('tier-chart');
        if (this.charts.tier) {
            this.charts.tier.destroy();
        }

        this.charts.tier = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['FREE', 'PRO', 'VIP'],
                datasets: [{
                    data: [sessions.free, sessions.pro, sessions.vip],
                    backgroundColor: ['#ef4444', '#6366f1', '#fbbf24'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    // ============================================
    // DAILY TRENDS
    // ============================================

    renderTrends() {
        const dailyStats = window.analyticsTracker.getDailyStats(7);
        
        const dates = dailyStats.map(d => {
            const date = new Date(d.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        const gameLimitData = dailyStats.map(d => 
            d.data.gameLimit?.hits || 0
        );

        const coachLockData = dailyStats.map(d => 
            d.data.coachLock?.clicks || 0
        );

        const ctx = document.getElementById('trends-chart');
        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Game Limits',
                        data: gameLimitData,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Coach Locks',
                        data: coachLockData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },

    // ============================================
    // UTILITIES
    // ============================================

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    exportData() {
        window.analyticsTracker.exportData();
    },

    clearData() {
        if (window.analyticsTracker.clearData()) {
            this.refreshData();
        }
    }
};

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => dashboard.init());
} else {
    dashboard.init();
}

console.log('✅ Analytics Dashboard Loaded');
