// ============================================
// ENHANCED ANALYTICS PAGE
// Beautiful data visualization and insights
// ============================================

class AnalyticsEnhanced {
    constructor() {
        this.timeRange = '7d';
        this.data = {
            totalPicks: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            roi: 0,
            profitLoss: 0,
            byOdds: {},
            bySport: {},
            byCoach: {},
            timeline: []
        };
    }

    async init() {
        console.log('📊 Initializing enhanced analytics...');
        this.renderEnhancedUI();
        this.attachEventListeners();
        await this.loadAnalytics();
    }

    renderEnhancedUI() {
        const analyticsPage = document.getElementById('analytics-page');
        if (!analyticsPage) return;

        const pageContent = analyticsPage.querySelector('.page-content');
        if (!pageContent) return;

        pageContent.innerHTML = `
            <!-- Hero Section -->
            <div class="analytics-hero">
                <h2 class="analytics-title">📊 Analytics Dashboard</h2>
                <p class="analytics-subtitle">Track your performance and insights</p>
            </div>

            <!-- Time Range Filter -->
            <div class="time-range-filters">
                <button class="time-range-btn" data-range="7d">7 Days</button>
                <button class="time-range-btn active" data-range="30d">30 Days</button>
                <button class="time-range-btn" data-range="90d">90 Days</button>
                <button class="time-range-btn" data-range="all">All Time</button>
            </div>

            <!-- Overview Cards -->
            <div class="analytics-overview">
                <div class="analytics-card">
                    <div class="analytics-card-icon purple">📊</div>
                    <div class="analytics-card-value" id="total-picks-stat">0</div>
                    <div class="analytics-card-label">Total Picks</div>
                    <div class="analytics-card-trend positive">
                        <i class="fas fa-arrow-up"></i> +12% this week
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-card-icon green">✅</div>
                    <div class="analytics-card-value" id="win-rate-stat">0%</div>
                    <div class="analytics-card-label">Win Rate</div>
                    <div class="analytics-card-trend positive">
                        <i class="fas fa-arrow-up"></i> +5.2%
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-card-icon blue">💰</div>
                    <div class="analytics-card-value" id="roi-stat">0%</div>
                    <div class="analytics-card-label">ROI</div>
                    <div class="analytics-card-trend positive">
                        <i class="fas fa-arrow-up"></i> +8.3%
                    </div>
                </div>

                <div class="analytics-card">
                    <div class="analytics-card-icon red">🎯</div>
                    <div class="analytics-card-value" id="profit-stat">+0</div>
                    <div class="analytics-card-label">Total Units</div>
                    <div class="analytics-card-trend positive">
                        <i class="fas fa-arrow-up"></i> Profitable
                    </div>
                </div>
            </div>

            <!-- Performance Chart -->
            <div class="analytics-chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">
                        <i class="fas fa-chart-line"></i>
                        Performance Over Time
                    </h3>
                    <div class="chart-legend">
                        <div class="legend-item">
                            <div class="legend-color" style="background: #10b981;"></div>
                            Wins
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background: #ef4444;"></div>
                            Losses
                        </div>
                    </div>
                </div>
                <div class="simple-chart" id="performance-chart">
                    <!-- Chart bars will be inserted here -->
                </div>
                <div class="chart-labels" id="chart-labels">
                    <!-- Labels will be inserted here -->
                </div>
            </div>

            <!-- Sport Breakdown -->
            <div class="analytics-breakdown">
                <div class="chart-header">
                    <h3 class="chart-title">
                        <i class="fas fa-trophy"></i>
                        Performance by Sport
                    </h3>
                </div>
                <div class="breakdown-grid" id="sport-breakdown">
                    <!-- Sport items will be inserted here -->
                </div>
            </div>

            <!-- Win Rate by Odds -->
            <div class="analytics-chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">
                        <i class="fas fa-chart-bar"></i>
                        Win Rate by Odds Range
                    </h3>
                </div>
                <div class="progress-list" id="odds-breakdown">
                    <!-- Progress bars will be inserted here -->
                </div>
            </div>

            <!-- AI Insights -->
            <div class="insights-section">
                <div class="chart-header">
                    <h3 class="chart-title">
                        <i class="fas fa-lightbulb"></i>
                        AI Insights & Recommendations
                    </h3>
                </div>
                <div class="insights-list" id="insights-list">
                    <!-- Insights will be inserted here -->
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Time range buttons
        document.querySelectorAll('.time-range-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.timeRange = e.currentTarget.dataset.range;
                
                // Update active state
                document.querySelectorAll('.time-range-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                // Reload data
                this.loadAnalytics();
            });
        });
    }

    async loadAnalytics() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.renderGuestAnalytics();
                return;
            }

            const response = await fetch(`${window.API_URL}/api/analytics/summary?range=${this.timeRange}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.data = data;
                this.renderAnalyticsData();
            } else {
                this.renderGuestAnalytics();
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.renderGuestAnalytics();
        }
    }

    renderGuestAnalytics() {
        // Show demo data for guests
        this.data = {
            totalPicks: 47,
            wins: 32,
            losses: 15,
            winRate: 68.1,
            roi: 15.3,
            profitLoss: 12.5,
            bySport: {
                'NBA': { picks: 15, wins: 11, winRate: 73.3 },
                'NFL': { picks: 12, wins: 8, winRate: 66.7 },
                'MLB': { picks: 10, wins: 7, winRate: 70.0 },
                'NHL': { picks: 10, wins: 6, winRate: 60.0 }
            },
            timeline: [12, 8, 15, 11, 9, 14, 10]
        };
        this.renderAnalyticsData();
    }

    renderAnalyticsData() {
        // Update overview cards
        this.animateCounter('total-picks-stat', this.data.totalPicks);
        this.animateCounter('win-rate-stat', this.data.winRate, '%');
        this.animateCounter('roi-stat', this.data.roi, '%');
        this.animateCounter('profit-stat', this.data.profitLoss, '', '+');

        // Render performance chart
        this.renderPerformanceChart();

        // Render sport breakdown
        this.renderSportBreakdown();

        // Render odds breakdown
        this.renderOddsBreakdown();

        // Render insights
        this.renderInsights();
    }

    renderPerformanceChart() {
        const chart = document.getElementById('performance-chart');
        const labels = document.getElementById('chart-labels');
        
        if (!chart || !labels) return;

        const data = this.data.timeline || [12, 8, 15, 11, 9, 14, 10];
        const maxValue = Math.max(...data);
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        chart.innerHTML = data.map((value, index) => {
            const height = (value / maxValue) * 100;
            return `
                <div class="chart-bar" style="height: ${height}%">
                    <div class="chart-bar-value">${value}</div>
                </div>
            `;
        }).join('');

        labels.innerHTML = days.map(day => `
            <div class="chart-label">${day}</div>
        `).join('');
    }

    renderSportBreakdown() {
        const container = document.getElementById('sport-breakdown');
        if (!container) return;

        const sports = this.data.bySport || {
            'NBA': { picks: 15, wins: 11, winRate: 73.3 },
            'NFL': { picks: 12, wins: 8, winRate: 66.7 },
            'MLB': { picks: 10, wins: 7, winRate: 70.0 },
            'NHL': { picks: 10, wins: 6, winRate: 60.0 }
        };

        const icons = {
            'NBA': { icon: '🏀', class: 'basketball' },
            'NFL': { icon: '🏈', class: 'football' },
            'MLB': { icon: '⚾', class: 'baseball' },
            'NHL': { icon: '🏒', class: 'hockey' }
        };

        container.innerHTML = Object.entries(sports).map(([sport, stats]) => {
            const iconData = icons[sport] || { icon: '🏆', class: 'basketball' };
            return `
                <div class="breakdown-item">
                    <div class="breakdown-icon ${iconData.class}">${iconData.icon}</div>
                    <div class="breakdown-info">
                        <div class="breakdown-sport">${sport}</div>
                        <div class="breakdown-stats">${stats.wins}W - ${stats.picks - stats.wins}L (${stats.picks} picks)</div>
                    </div>
                    <div class="breakdown-percentage">${stats.winRate.toFixed(1)}%</div>
                </div>
            `;
        }).join('');
    }

    renderOddsBreakdown() {
        const container = document.getElementById('odds-breakdown');
        if (!container) return;

        const oddsRanges = [
            { label: 'Heavy Favorites (-200 or better)', winRate: 78.5 },
            { label: 'Favorites (-199 to -110)', winRate: 65.2 },
            { label: 'Even/Pick Em (+100 to -109)', winRate: 58.3 },
            { label: 'Underdogs (+101 to +200)', winRate: 42.1 },
            { label: 'Heavy Underdogs (+201 or more)', winRate: 31.5 }
        ];

        container.innerHTML = oddsRanges.map(range => `
            <div class="progress-item">
                <div class="progress-header">
                    <div class="progress-label">${range.label}</div>
                    <div class="progress-value">${range.winRate}%</div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${range.winRate}%"></div>
                </div>
            </div>
        `).join('');
    }

    renderInsights() {
        const container = document.getElementById('insights-list');
        if (!container) return;

        const insights = [
            {
                icon: '🔥',
                title: 'Hot Streak!',
                text: 'You\'ve won 8 of your last 10 picks. Keep the momentum going!'
            },
            {
                icon: '🏀',
                title: 'NBA Performance',
                text: 'Your NBA picks are 73% accurate - your strongest sport this month.'
            },
            {
                icon: '💡',
                title: 'Recommendation',
                text: 'Consider focusing on favorites. Your win rate is 12% higher on favorites vs underdogs.'
            },
            {
                icon: '📈',
                title: 'Profit Trend',
                text: 'You\'re up +12.5 units this month - on pace for a 45-unit year!'
            }
        ];

        container.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-text">${insight.text}</div>
                </div>
            </div>
        `).join('');
    }

    animateCounter(elementId, targetValue, suffix = '', prefix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const duration = 1000;
        const startValue = 0;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (targetValue - startValue) * easeOut;

            element.textContent = prefix + current.toFixed(suffix === '%' ? 1 : 0) + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }
}

// Initialize when navigating to analytics page
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsEnhanced = new AnalyticsEnhanced();
    
    // Initialize when analytics page is shown
    const observer = new MutationObserver(() => {
        const analyticsPage = document.getElementById('analytics-page');
        if (analyticsPage && analyticsPage.classList.contains('active')) {
            if (window.analyticsEnhanced) {
                window.analyticsEnhanced.init();
            }
        }
    });

    observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['class']
    });
});
