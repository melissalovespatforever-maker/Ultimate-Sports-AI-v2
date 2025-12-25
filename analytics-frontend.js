// ============================================
// ANALYTICS FRONTEND MODULE
// Display user analytics and statistics
// ============================================

console.log('📊 Loading Analytics Module');

class AnalyticsManager {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM and check if analytics page exists
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAnalytics());
        } else {
            this.setupAnalytics();
        }
    }

    setupAnalytics() {
        const container = document.getElementById('analytics-container');
        if (!container) return;

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

                <!-- Performance Chart Placeholder -->
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                    <h3 style="margin: 0 0 20px; display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-chart-area"></i>
                        Performance Over Time
                    </h3>
                    <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                        <i class="fas fa-chart-bar" style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;"></i>
                        <p>Chart visualization coming soon</p>
                        <p style="font-size: 14px; margin-top: 8px;">Make more picks to see your performance trends</p>
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
                        <button class="btn btn-primary" style="margin-top: 20px;" onclick="navigation.navigateTo('live-scores')">
                            <i class="fas fa-play-circle"></i> View Live Scores
                        </button>
                    </div>
                </div>
            </div>
        `;
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

        // Update home page stats if they exist
        this.updateHomeStats(stats);

        return stats;
    }

    updateHomeStats(stats) {
        const totalPicksEl = document.getElementById('total-picks');
        const winRateEl = document.getElementById('win-rate');
        const currentStreakEl = document.getElementById('current-streak');

        if (totalPicksEl) totalPicksEl.textContent = stats.totalPicks;
        if (winRateEl) winRateEl.textContent = stats.winRate + '%';
        if (currentStreakEl) currentStreakEl.textContent = stats.currentStreak;
    }
}

// Initialize analytics manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.analyticsManager = new AnalyticsManager();
    });
} else {
    window.analyticsManager = new AnalyticsManager();
}

console.log('✅ Analytics module loaded');
              
