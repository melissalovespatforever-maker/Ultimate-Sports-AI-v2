/**
 * ============================================
 * DAILY TOP EARNERS WIDGET
 * Displays a leaderboard of top players for the day
 * ============================================
 */

class TopEarnersWidget {
    constructor() {
        this.container = null;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        console.log('🏆 Initializing Top Earners Widget');
        this.renderPlaceholder();
        
        // Initial load
        this.refreshData();
        
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => this.refreshData(), 5 * 60 * 1000);
    }

    renderPlaceholder() {
        this.container = document.getElementById('top-earners-container');
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="leaderboard-card glass-card">
                <div class="leaderboard-loading">
                    <div class="spinner-sm"></div>
                    <span>Loading top earners...</span>
                </div>
            </div>
        `;
    }

    async refreshData() {
        if (!this.container) {
            this.container = document.getElementById('top-earners-container');
        }
        if (!this.container) return;

        try {
            // In a real production app, we would fetch from /api/leaderboards/daily-earners
            // For now, we simulate a live leaderboard with realistic data
            const earners = this.generateMockEarners();
            this.render(earners);
        } catch (error) {
            console.error('Error refreshing top earners:', error);
        }
    }

    generateMockEarners() {
        const usernames = [
            'ParlayKing', 'BetMaster', 'SportsFan99', 'AIPredictor', 
            'WhaleWatcher', 'StreakHunter', 'LuckyLegend', 'DataNinja',
            'ChampionBetter', 'ThePro'
        ];
        
        const avatars = ['👑', '🔥', '💎', '🎯', '🐋', '⚡', '🏆', '⭐', '🚀', '🎰'];
        
        // Create 5 top earners
        const earners = [];
        const usedIndexes = new Set();
        
        for (let i = 0; i < 5; i++) {
            let index;
            do {
                index = Math.floor(Math.random() * usernames.length);
            } while (usedIndexes.has(index));
            
            usedIndexes.add(index);
            
            // Base earnings decrease by rank
            const base = (5 - i) * 2000;
            const randomExtra = Math.floor(Math.random() * 1500);
            
            earners.push({
                rank: i + 1,
                username: usernames[index],
                avatar: avatars[index],
                earnings: base + randomExtra
            });
        }
        
        // Add current user if they are "winning" (simulated)
        const currentUser = localStorage.getItem('unified_username') || 'You';
        if (Math.random() > 0.7) {
            const myEarnings = Math.floor(Math.random() * 3000) + 500;
            // Only add if not already in list
            if (!earners.some(e => e.username === currentUser)) {
                 earners.push({
                    rank: '?',
                    username: currentUser + ' (You)',
                    avatar: localStorage.getItem('unified_avatar') || '😊',
                    earnings: myEarnings,
                    isCurrentUser: true
                });
            }
        }

        return earners;
    }

    render(earners) {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="leaderboard-card glass-card">
                <div class="leaderboard-header">
                    <h3><i class="fas fa-trophy"></i> Daily Top Earners</h3>
                    <div class="live-indicator">
                        <div class="live-dot"></div>
                        LIVE
                    </div>
                </div>
                
                <div class="leaderboard-list">
                    ${earners.map(player => this.renderPlayerRow(player)).join('')}
                </div>
                
                <div class="leaderboard-footer">
                    <button class="view-all-leaderboards" onclick="window.open('leaderboard-badges.html', '_blank')">
                        View Full Leaderboards <i class="fas fa-external-link-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderPlayerRow(player) {
        const rankClass = player.rank === 1 ? 'gold' : player.rank === 2 ? 'silver' : player.rank === 3 ? 'bronze' : '';
        const rankDisplay = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`;
        
        return `
            <div class="leaderboard-item ${player.isCurrentUser ? 'current-user' : ''}">
                <div class="player-rank ${rankClass}">${rankDisplay}</div>
                <div class="player-avatar">${player.avatar}</div>
                <div class="player-info">
                    <span class="player-name">${player.username}</span>
                </div>
                <div class="player-earnings">
                    <span class="coin-icon">🪙</span>
                    <span class="amount">+${player.earnings.toLocaleString()}</span>
                </div>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.topEarnersWidget = new TopEarnersWidget();
});
