
/**
 * PaperTradingLeaderboard - Tracks and displays virtual betting performance
 */
export class PaperTradingLeaderboard {
    constructor() {
        this.container = null;
        this.mockUsers = this.generateMockUsers();
        this.currentUserStats = this.loadCurrentUserStats();
    }

    /**
     * Generate high-performing mock users for the leaderboard
     */
    generateMockUsers() {
        return [
            { id: 1, name: 'SharpVegas88', roi: 24.5, profit: 12450, winRate: 62.4, streak: 5, avatar: '🎯' },
            { id: 2, name: 'ParlayQueen', roi: 19.2, profit: 8900, winRate: 58.1, streak: 3, avatar: '👸' },
            { id: 3, name: 'AlgorithmAce', roi: 15.8, profit: 15600, winRate: 65.2, streak: 12, avatar: '🤖' },
            { id: 4, name: 'UnderdogFan', roi: 12.4, profit: 4200, winRate: 49.5, streak: 2, avatar: '🐕' },
            { id: 5, name: 'LineWatcher', roi: 11.1, profit: 3100, winRate: 54.8, streak: -1, avatar: '👀' }
        ];
    }

    /**
     * Load current user's betting stats from localStorage
     */
    loadCurrentUserStats() {
        const savedParlays = JSON.parse(localStorage.getItem('betting_saved_parlays') || '[]');
        const settledParlays = savedParlays.filter(p => p.status === 'won' || p.status === 'lost');
        
        if (settledParlays.length === 0) {
            return {
                name: 'You (No settled bets)',
                roi: 0,
                profit: 0,
                winRate: 0,
                streak: 0,
                avatar: '👤',
                isUser: true
            };
        }

        const won = settledParlays.filter(p => p.status === 'won');
        const totalWagered = settledParlays.reduce((sum, p) => sum + parseFloat(p.wager), 0);
        const totalProfit = settledParlays.reduce((sum, p) => {
            if (p.status === 'won') return sum + parseFloat(p.profit);
            return sum - parseFloat(p.wager);
        }, 0);

        const roi = (totalProfit / totalWagered) * 100;
        const winRate = (won.length / settledParlays.length) * 100;

        return {
            name: 'You',
            roi: roi.toFixed(1),
            profit: totalProfit.toFixed(2),
            winRate: winRate.toFixed(1),
            streak: this.calculateStreak(settledParlays),
            avatar: '👤',
            isUser: true
        };
    }

    /**
     * Calculate current win/loss streak
     */
    calculateStreak(parlays) {
        if (parlays.length === 0) return 0;
        let streak = 0;
        const latestStatus = parlays[0].status;
        
        for (const p of parlays) {
            if (p.status === latestStatus) {
                streak++;
            } else {
                break;
            }
        }
        
        return latestStatus === 'won' ? streak : -streak;
    }

    /**
     * Open the leaderboard modal
     */
    open() {
        if (this.container) this.close();
        
        this.currentUserStats = this.loadCurrentUserStats();
        this.createUI();
        
        requestAnimationFrame(() => {
            this.container.classList.add('visible');
        });
    }

    /**
     * Create the leaderboard UI
     */
    createUI() {
        this.container = document.createElement('div');
        this.container.className = 'paper-leaderboard-overlay';
        
        const allUsers = [...this.mockUsers, this.currentUserStats].sort((a, b) => b.roi - a.roi);

        this.container.innerHTML = `
            <div class="paper-leaderboard-modal">
                <div class="paper-leaderboard-header">
                    <div class="header-title">
                        <i class="fas fa-trophy"></i>
                        <h2>Paper Trading Leaderboard</h2>
                    </div>
                    <button class="close-btn" onclick="window.paperLeaderboard?.close()">✕</button>
                </div>
                
                <div class="leaderboard-tabs">
                    <button class="leaderboard-tab active">Top ROI %</button>
                    <button class="leaderboard-tab">Total Profit</button>
                    <button class="leaderboard-tab">Win Rate</button>
                </div>

                <div class="leaderboard-table-container">
                    <table class="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Trader</th>
                                <th>ROI %</th>
                                <th>Profit</th>
                                <th>Win Rate</th>
                                <th>Streak</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allUsers.map((user, index) => `
                                <tr class="${user.isUser ? 'user-row' : ''}">
                                    <td>
                                        <div class="rank-badge rank-${index + 1}">
                                            ${index + 1}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="trader-info">
                                            <span class="trader-avatar">${user.avatar}</span>
                                            <span class="trader-name">${user.name}</span>
                                        </div>
                                    </td>
                                    <td class="roi-value ${user.roi >= 0 ? 'positive' : 'negative'}">
                                        ${user.roi > 0 ? '+' : ''}${user.roi}%
                                    </td>
                                    <td class="profit-value ${user.profit >= 0 ? 'positive' : 'negative'}">
                                        $${user.profit}
                                    </td>
                                    <td>${user.winRate}%</td>
                                    <td>
                                        <span class="streak-badge ${user.streak >= 0 ? 'hot' : 'cold'}">
                                            ${Math.abs(user.streak)}${user.streak >= 0 ? 'W' : 'L'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="leaderboard-footer">
                    <div class="user-summary">
                        <h3>Your Performance</h3>
                        <div class="summary-grid">
                            <div class="summary-item">
                                <span class="label">Rank</span>
                                <span class="value">#${allUsers.findIndex(u => u.isUser) + 1}</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">ROI</span>
                                <span class="value">${this.currentUserStats.roi}%</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Profit</span>
                                <span class="value">$${this.currentUserStats.profit}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);

        // Close on background click
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) this.close();
        });
    }

    /**
     * Close the leaderboard modal
     */
    close() {
        if (!this.container) return;
        this.container.classList.remove('visible');
        setTimeout(() => {
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
            this.container = null;
        }, 300);
    }
}

// Global instance
window.paperLeaderboard = new PaperTradingLeaderboard();
