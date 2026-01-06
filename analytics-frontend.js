// ============================================
// ANALYTICS FRONTEND MODULE
// Display user analytics and statistics
// ============================================

console.log('📊 Loading Analytics Module');

class AnalyticsManager {
    constructor() {
        try {
            this.dateRange = this.getStoredDateRange() || { type: 'all', days: null };
            this.chart = null;
            this.init();
        } catch (e) {
            console.error('❌ Analytics init error:', e);
        }
    }

    getStoredDateRange() {
        try {
            const stored = localStorage.getItem('analyticsDateRange');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    }

    setDateRange(type, days = null) {
        this.dateRange = { type, days };
        localStorage.setItem('analyticsDateRange', JSON.stringify(this.dateRange));
        this.renderAnalytics();
    }

    init() {
        // Safety: only run after page is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                try {
                    this.setupAnalytics();
                } catch (e) {
                    console.error('Analytics setup error:', e);
                }
            });
        } else {
            try {
                this.setupAnalytics();
            } catch (e) {
                console.error('Analytics setup error:', e);
            }
        }
    }

    setupAnalytics() {
        const container = document.getElementById('analytics-container');
        if (!container) return;

        // Render immediately on setup
        this.renderAnalytics();

        // Also listen for page navigation events
        document.addEventListener('page-analytics-loaded', () => {
            this.renderAnalytics();
        });

        // Observe when analytics page becomes visible
        const observer = new MutationObserver(() => {
            const analyticsPage = document.getElementById('analytics-page');
            if (analyticsPage && analyticsPage.classList.contains('active')) {
                this.renderAnalytics();
            }
        });

        const analyticsPage = document.getElementById('analytics-page');
        if (analyticsPage) {
            observer.observe(analyticsPage, { attributes: true, attributeFilter: ['class'] });
        }

        // Also render if page is already active
        if (analyticsPage?.classList.contains('active')) {
            this.renderAnalytics();
        }
    }

    renderAnalytics() {
        const container = document.getElementById('analytics-container');
        if (!container) return;

        // Get user stats from localStorage or set defaults
        const stats = this.getUserStats();

        container.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <h2 style="margin: 0;">Analytics Overview</h2>
                    <button class="btn btn-primary" onclick="window.paperLeaderboard?.open()" style="background: linear-gradient(135deg, #ffd700, #b8860b); color: #000; border: none; font-weight: 800;">
                        <i class="fas fa-trophy"></i> Global Leaderboard
                    </button>
                </div>
                <!-- Overview Stats -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 32px;">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-info">
                            <h4>${stats.totalPicks}</h4>
                            <p>Total Picks</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stat-info">
                            <h4>${stats.wins}</h4>
                            <p>Wins</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h4>${stats.losses}</h4>
                            <p>Losses</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="stat-info">
                            <h4>${stats.winRate}%</h4>
                            <p>Win Rate</p>
                        </div>
                    </div>
                </div>

                <!-- Performance Chart -->
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                        <h3 style="margin: 0; display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-chart-area"></i>
                            Performance Over Time
                        </h3>
                        <div id="date-range-controls" style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button class="filter-btn ${this.dateRange.type === '7' ? 'active' : ''}" onclick="window.analyticsManager.setDateRange('7', 7)" style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: ${this.dateRange.type === '7' ? 'var(--primary-color)' : 'transparent'}; color: ${this.dateRange.type === '7' ? '#fff' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
                                Last 7 Days
                            </button>
                            <button class="filter-btn ${this.dateRange.type === '30' ? 'active' : ''}" onclick="window.analyticsManager.setDateRange('30', 30)" style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: ${this.dateRange.type === '30' ? 'var(--primary-color)' : 'transparent'}; color: ${this.dateRange.type === '30' ? '#fff' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
                                Last 30 Days
                            </button>
                            <button class="filter-btn ${this.dateRange.type === 'all' ? 'active' : ''}" onclick="window.analyticsManager.setDateRange('all', null)" style="padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: ${this.dateRange.type === 'all' ? 'var(--primary-color)' : 'transparent'}; color: ${this.dateRange.type === 'all' ? '#fff' : 'var(--text-primary)'}; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
                                All Time
                            </button>
                        </div>
                    </div>
                    <div style="height: 300px; position: relative;">
                        <canvas id="performance-chart"></canvas>
                    </div>
                </div>

                <!-- Sport Breakdown -->
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                    <h3 style="margin: 0 0 20px; display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-football-ball"></i>
                        Performance by Sport
                    </h3>
                    <div style="display: grid; gap: 16px;">
                        ${this.renderSportStats(stats.bySport)}
                    </div>
                </div>

                <!-- Recent Activity -->
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px;">
                    <h3 style="margin: 0 0 20px; display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-history"></i>
                        Recent Activity
                    </h3>
                    <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                        <p>No recent activity</p>
                        <p style="font-size: 14px; margin-top: 8px;">Start making picks to see your activity here</p>
                        <button class="btn btn-primary" style="margin-top: 20px;" onclick="window.appNavigation.navigateTo('live-scores')">
                            <i class="fas fa-play-circle"></i> View Live Scores
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Initialize Chart
        setTimeout(() => this.initPerformanceChart(), 100);
    }

    initPerformanceChart() {
        const ctx = document.getElementById('performance-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Prepare Data
        const chartData = this.getPerformanceData();

        if (chartData.labels.length === 0) {
            // Show placeholder if no data
            const container = ctx.parentElement;
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p>No enough data for chart</p>
                    <p style="font-size: 14px; opacity: 0.7;">Make some picks to see your progress!</p>
                </div>
            `;
            return;
        }

        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Bankroll Growth ($)',
                    data: chartData.data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'transparent'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'transparent'
                        },
                        ticks: {
                            color: '#64748b',
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    getPerformanceData() {
        // Get bets from localStorage
        let bets = [];
        try {
            const saved = localStorage.getItem('my_saved_bets');
            if (saved) {
                bets = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error parsing bets for chart:', e);
        }

        // Filter for finished bets (won/lost) and sort by date ASC
        let history = bets
            .filter(b => b.status === 'won' || b.status === 'lost')
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Apply date range filtering
        if (this.dateRange.type !== 'all' && this.dateRange.days) {
            const now = new Date();
            const cutoffDate = new Date(now.getTime() - (this.dateRange.days * 24 * 60 * 60 * 1000));
            history = history.filter(bet => new Date(bet.timestamp) >= cutoffDate);
        }

        const labels = [];
        const data = [];
        let currentBankroll = 0; // Relative bankroll change

        // Initial point
        if (history.length > 0) {
            labels.push('Start');
            data.push(0);
        }

        history.forEach(bet => {
            // Parse stake and win
            const stake = parseFloat(bet.stake.replace(/[^0-9.]/g, '')) || 0;
            const potentialWin = parseFloat(bet.potentialWin.replace(/[^0-9.]/g, '')) || 0;
            
            let profit = 0;
            if (bet.status === 'won') {
                profit = potentialWin - stake;
            } else if (bet.status === 'lost') {
                profit = -stake;
            }

            currentBankroll += profit;

            // Format date
            const date = new Date(bet.timestamp);
            const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

            labels.push(dateStr);
            data.push(currentBankroll);
        });

        return { labels, data };
    }

    renderSportStats(sportStats) {
        const sports = [
            { name: 'NFL', icon: 'fas fa-football-ball', color: '#10b981' },
            { name: 'NBA', icon: 'fas fa-basketball-ball', color: '#f59e0b' },
            { name: 'MLB', icon: 'fas fa-baseball-ball', color: '#3b82f6' },
            { name: 'NHL', icon: 'fas fa-hockey-puck', color: '#ef4444' },
            { name: 'Soccer', icon: 'fas fa-futbol', color: '#8b5cf6' }
        ];

        return sports.map(sport => {
            const stats = sportStats[sport.name] || { picks: 0, wins: 0, winRate: 0 };
            return `
                <div style="display: flex; align-items: center; padding: 16px; background: var(--bg-tertiary); border-radius: 12px;">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: ${sport.color}; display: flex; align-items: center; justify-content: center; color: white; margin-right: 16px;">
                        <i class="${sport.icon}" style="font-size: 24px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${sport.name}</div>
                        <div style="font-size: 14px; color: var(--text-secondary);">${stats.picks} picks • ${stats.wins} wins • ${stats.winRate}% win rate</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getUserStats() {
        // Get stats from localStorage or return defaults
        const savedStats = localStorage.getItem('userAnalytics');
        if (savedStats) {
            try {
                return JSON.parse(savedStats);
            } catch (e) {
                console.warn('Failed to parse user stats');
            }
        }

        // Default stats
        return {
            totalPicks: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            currentStreak: 0,
            bestStreak: 0,
            bySport: {
                'NFL': { picks: 0, wins: 0, winRate: 0 },
                'NBA': { picks: 0, wins: 0, winRate: 0 },
                'MLB': { picks: 0, wins: 0, winRate: 0 },
                'NHL': { picks: 0, wins: 0, winRate: 0 },
                'Soccer': { picks: 0, wins: 0, winRate: 0 }
            }
        };
    }

    updateStats(sport, isWin) {
        const stats = this.getUserStats();
        
        stats.totalPicks++;
        if (isWin) {
            stats.wins++;
            stats.currentStreak++;
            stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
        } else {
            stats.losses++;
            stats.currentStreak = 0;
        }
        
        stats.winRate = stats.totalPicks > 0 ? Math.round((stats.wins / stats.totalPicks) * 100) : 0;

        // Update sport-specific stats
        if (stats.bySport[sport]) {
            stats.bySport[sport].picks++;
            if (isWin) {
                stats.bySport[sport].wins++;
            }
            stats.bySport[sport].winRate = stats.bySport[sport].picks > 0 
                ? Math.round((stats.bySport[sport].wins / stats.bySport[sport].picks) * 100) 
                : 0;
        }

        // Save to localStorage
        localStorage.setItem('userAnalytics', JSON.stringify(stats));

        return stats;
    }
}

// Initialize analytics manager
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try {
                window.analyticsManager = new AnalyticsManager();
                console.log('✅ Analytics manager initialized');
            } catch (e) {
                console.error('Failed to init analytics manager:', e);
            }
        });
    } else {
        window.analyticsManager = new AnalyticsManager();
        console.log('✅ Analytics manager initialized');
    }
} catch (e) {
    console.error('Analytics module error:', e);
}

console.log('✅ Analytics module loaded');
