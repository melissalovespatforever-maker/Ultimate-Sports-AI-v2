// ============================================
// ACHIEVEMENT LEADERBOARDS - REAL-TIME SYSTEM
// ============================================

class AchievementLeaderboards {
    constructor() {
        this.currentTab = 'overall';
        this.timeFilter = 'all-time';
        this.selectedCategory = 'login';
        this.refreshInterval = null;
        this.mockData = this.generateMockData(); // For demo purposes
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupWebSocketListeners();
        this.loadLeaderboards();
        this.updatePersonalStats();
        this.startAutoRefresh();
        console.log('✅ Achievement Leaderboards initialized');
    }

    setupWebSocketListeners() {
        // Listen for real-time achievement unlocks
        if (window.socket) {
            window.socket.on('achievement:unlock', (data) => {
                this.handleRealtimeUnlock(data);
            });
            console.log('🔌 WebSocket listeners registered for leaderboards');
        } else {
            console.warn('⚠️ WebSocket not available - falling back to polling');
        }
    }

    handleRealtimeUnlock(data) {
        console.log('🎉 Real-time unlock received:', data);

        // Add to recent unlocks at the top
        if (this.currentTab === 'recent') {
            const container = document.getElementById('recent-feed');
            const newActivity = document.createElement('div');
            newActivity.className = 'activity-item';
            newActivity.innerHTML = `
                <div class="activity-icon">${data.icon || '🎯'}</div>
                <div class="activity-content">
                    <div>
                        <span class="activity-player">${data.username || 'A player'}</span>
                        unlocked
                    </div>
                    <div class="activity-achievement">${data.achievementName}</div>
                </div>
                <div class="activity-time">Just now</div>
            `;

            // Insert at the top with animation
            if (container.firstChild) {
                container.insertBefore(newActivity, container.firstChild);
            } else {
                container.appendChild(newActivity);
            }

            // Remove oldest entry if more than 30
            const items = container.querySelectorAll('.activity-item');
            if (items.length > 30) {
                items[items.length - 1].remove();
            }
        }

        // Optionally refresh overall leaderboard (debounced)
        if (this.currentTab === 'overall') {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = setTimeout(() => {
                this.loadOverallLeaderboard();
            }, 5000); // Refresh after 5 seconds of no new unlocks
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.lb-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.switchTab(type);
            });
        });

        // Time filter
        const timeFilter = document.getElementById('time-filter');
        if (timeFilter) {
            timeFilter.addEventListener('change', (e) => {
                this.timeFilter = e.target.value;
                this.loadOverallLeaderboard();
            });
        }

        // Category select
        const categorySelect = document.getElementById('category-select');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.selectedCategory = e.target.value;
                this.loadCategoryLeaderboard();
            });
        }
    }

    switchTab(type) {
        this.currentTab = type;

        // Update active tab
        document.querySelectorAll('.lb-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });

        // Show/hide sections
        document.getElementById('overall-leaderboard').style.display = type === 'overall' ? 'block' : 'none';
        document.getElementById('recent-unlocks').style.display = type === 'recent' ? 'block' : 'none';
        document.getElementById('category-leaderboards').style.display = type === 'category' ? 'block' : 'none';
        document.getElementById('rare-achievements').style.display = type === 'rare' ? 'block' : 'none';

        // Load appropriate data
        if (type === 'overall') this.loadOverallLeaderboard();
        else if (type === 'recent') this.loadRecentUnlocks();
        else if (type === 'category') this.loadCategoryLeaderboard();
        else if (type === 'rare') this.loadRareAchievements();
    }

    async loadLeaderboards() {
        this.loadOverallLeaderboard();
        this.updateQuickStats();
    }

    async loadOverallLeaderboard() {
        const container = document.getElementById('overall-list');
        container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner"></i><p>Loading rankings...</p></div>';

        // Simulate API call
        await this.delay(500);

        const players = this.mockData.players.slice(0, 50);
        const currentUserId = this.getCurrentUserId();

        container.innerHTML = players.map((player, index) => {
            const rank = index + 1;
            const isCurrentUser = player.id === currentUserId;
            
            return `
                <div class="leaderboard-entry ${isCurrentUser ? 'highlight' : ''}">
                    <div class="rank-badge rank-${rank <= 3 ? rank : 'other'}">
                        ${rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                    </div>
                    <div class="player-info">
                        <div class="player-name">${player.username}</div>
                        <div class="player-badges">
                            <i class="fas fa-medal"></i>
                            ${player.badgesUnlocked} / ${player.totalBadges} badges
                        </div>
                    </div>
                    <div class="player-stats">
                        <div class="stat-item">
                            <i class="fas fa-star"></i>
                            <span class="stat-item-value">${this.formatNumber(player.xp)}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-percent"></i>
                            <span class="stat-item-value">${player.completionRate}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadRecentUnlocks() {
        const container = document.getElementById('recent-feed');
        container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner"></i><p>Loading recent activity...</p></div>';

        await this.delay(500);

        const recentUnlocks = this.mockData.recentUnlocks.slice(0, 30);

        container.innerHTML = recentUnlocks.map(unlock => {
            return `
                <div class="activity-item">
                    <div class="activity-icon">${unlock.icon}</div>
                    <div class="activity-content">
                        <div>
                            <span class="activity-player">${unlock.username}</span>
                            unlocked
                        </div>
                        <div class="activity-achievement">${unlock.achievementName}</div>
                    </div>
                    <div class="activity-time">${this.formatTimeAgo(unlock.timestamp)}</div>
                </div>
            `;
        }).join('');
    }

    async loadCategoryLeaderboard() {
        const container = document.getElementById('category-list');
        container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner"></i><p>Loading category leaders...</p></div>';

        await this.delay(500);

        const categoryData = this.getCategoryLeaders(this.selectedCategory);
        const currentUserId = this.getCurrentUserId();

        container.innerHTML = categoryData.map((player, index) => {
            const rank = index + 1;
            const isCurrentUser = player.id === currentUserId;
            
            return `
                <div class="leaderboard-entry ${isCurrentUser ? 'highlight' : ''}">
                    <div class="rank-badge rank-${rank <= 3 ? rank : 'other'}">
                        ${rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                    </div>
                    <div class="player-info">
                        <div class="player-name">${player.username}</div>
                        <div class="player-badges">
                            <i class="fas fa-medal"></i>
                            ${player.categoryBadges} ${this.getCategoryName(this.selectedCategory)} badges
                        </div>
                    </div>
                    <div class="player-stats">
                        <div class="stat-item">
                            <i class="fas fa-trophy"></i>
                            <span class="stat-item-value">${player.categoryScore}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadRareAchievements() {
        const container = document.getElementById('rare-grid');
        container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner"></i><p>Loading rare achievements...</p></div>';

        await this.delay(500);

        const rareAchievements = this.getRareAchievements();

        container.innerHTML = rareAchievements.map(achievement => {
            return `
                <div class="rare-achievement-card">
                    <div class="rare-icon">${achievement.icon}</div>
                    <div class="rare-name">${achievement.name}</div>
                    <div class="rare-description">${achievement.description}</div>
                    <div class="rare-stats">
                        <div class="rare-stat">
                            <span class="rare-stat-label">Rarity</span>
                            <span class="rare-stat-value">${achievement.rarity}%</span>
                        </div>
                        <div class="rare-stat">
                            <span class="rare-stat-label">Unlocked By</span>
                            <span class="rare-stat-value">${achievement.unlockCount}</span>
                        </div>
                        <div class="rare-stat">
                            <span class="rare-stat-label">XP Reward</span>
                            <span class="rare-stat-value">${achievement.xp}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateQuickStats() {
        const totalPlayers = this.mockData.players.length;
        const currentUserId = this.getCurrentUserId();
        const userRank = this.mockData.players.findIndex(p => p.id === currentUserId) + 1;
        const userBadges = window.achievementsSystem ? window.achievementsSystem.getUnlockedCount() : 0;
        const totalBadges = window.achievementsSystem ? window.achievementsSystem.getTotalCount() : 0;
        const completionRate = totalBadges > 0 ? Math.round((userBadges / totalBadges) * 100) : 0;

        document.getElementById('total-players').textContent = this.formatNumber(totalPlayers);
        document.getElementById('your-rank').textContent = userRank > 0 ? `#${userRank}` : '--';
        document.getElementById('your-badges').textContent = userBadges;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
    }

    updatePersonalStats() {
        if (!window.achievementsSystem) return;

        const userBadges = window.achievementsSystem.getUnlockedCount();
        const totalBadges = window.achievementsSystem.getTotalCount();
        const userStats = window.achievementsSystem.userStats;
        const currentUserId = this.getCurrentUserId();
        const userRank = this.mockData.players.findIndex(p => p.id === currentUserId) + 1;

        // Badges progress
        const badgesFill = document.getElementById('personal-badges-fill');
        const badgesText = document.getElementById('personal-badges-text');
        const percentage = totalBadges > 0 ? (userBadges / totalBadges) * 100 : 0;
        
        if (badgesFill) badgesFill.style.width = `${percentage}%`;
        if (badgesText) badgesText.textContent = `${userBadges} / ${totalBadges}`;

        // XP
        const xpElement = document.getElementById('personal-xp');
        if (xpElement) xpElement.textContent = this.formatNumber(userStats.xp || 0);

        // Streak
        const streakElement = document.getElementById('personal-streak');
        if (streakElement) {
            const streak = userStats.loginStreak || 0;
            streakElement.textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
        }

        // Global rank
        const rankElement = document.getElementById('personal-global-rank');
        if (rankElement) rankElement.textContent = userRank > 0 ? `#${userRank}` : '--';
    }

    startAutoRefresh() {
        // Refresh recent unlocks every 10 seconds
        this.refreshInterval = setInterval(() => {
            if (this.currentTab === 'recent') {
                this.loadRecentUnlocks();
            }
        }, 10000);
    }

    // ========== HELPER METHODS ==========

    getCurrentUserId() {
        // Try to get from localStorage or generate a stable ID
        let userId = localStorage.getItem('mock_user_id');
        if (!userId) {
            userId = `user_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('mock_user_id', userId);
        }
        return userId;
    }

    getCategoryLeaders(category) {
        // Generate mock category-specific data
        return this.mockData.players.slice(0, 20).map(player => ({
            ...player,
            categoryBadges: Math.floor(Math.random() * 10) + 1,
            categoryScore: Math.floor(Math.random() * 50000) + 1000
        })).sort((a, b) => b.categoryScore - a.categoryScore);
    }

    getCategoryName(category) {
        const names = {
            login: 'Login',
            betting: 'Betting',
            tournament: 'Tournament',
            minigames: 'Minigame',
            collection: 'Collection',
            coins: 'Wealth',
            rank: 'Rank',
            social: 'Social',
            special: 'Special'
        };
        return names[category] || category;
    }

    getRareAchievements() {
        if (!window.achievementsSystem) return [];

        const achievements = Object.values(window.achievementsSystem.achievements);
        
        // Define rarity based on achievement type
        const rareAchievements = [
            { ...achievements.find(a => a.id === 'hall-of-fame'), rarity: 0.1, unlockCount: 5 },
            { ...achievements.find(a => a.id === 'perfect-season'), rarity: 0.3, unlockCount: 18 },
            { ...achievements.find(a => a.id === 'streak-100'), rarity: 1.2, unlockCount: 67 },
            { ...achievements.find(a => a.id === 'coins-1m'), rarity: 2.5, unlockCount: 142 },
            { ...achievements.find(a => a.id === 'minigame-veteran'), rarity: 3.8, unlockCount: 215 },
            { ...achievements.find(a => a.id === 'early-adopter'), rarity: 5.0, unlockCount: 284 }
        ].filter(a => a && a.id);

        return rareAchievements.map(a => ({
            ...a,
            xp: a.xp || 0
        }));
    }

    generateMockData() {
        const usernames = [
            'SportsKing', 'BetMaster', 'LuckyGamer', 'ProPlayer', 'ChampionX',
            'VictoryRush', 'GoldenStreak', 'AceGamer', 'TopBetter', 'ElitePlayer',
            'MegaWinner', 'SportsFan99', 'BetLegend', 'GamerPro', 'TourneyKing',
            'StreakMaster', 'WinnerTake', 'SportsBoss', 'BetHero', 'GameChamp'
        ];

        // Generate players with realistic stats
        const players = Array.from({ length: 100 }, (_, i) => {
            const baseXP = Math.max(0, 150000 - (i * 1500) - Math.random() * 1000);
            const totalBadges = 50;
            const badgesUnlocked = Math.max(1, Math.min(totalBadges, Math.floor((baseXP / 3000)) + Math.floor(Math.random() * 5)));
            
            return {
                id: `player_${i}`,
                username: i === 0 ? (localStorage.getItem('temp_username') || 'You') : usernames[i % usernames.length] + (i > 19 ? Math.floor(i / 20) : ''),
                badgesUnlocked,
                totalBadges,
                xp: Math.floor(baseXP),
                completionRate: Math.round((badgesUnlocked / totalBadges) * 100),
                rank: i + 1
            };
        });

        // Generate recent unlocks
        const achievementNames = [
            { name: 'Week Warrior', icon: '⚡' },
            { name: 'First Wager', icon: '🎲' },
            { name: 'Bronze Rookie', icon: '🥉' },
            { name: 'Hot Streak', icon: '🔥' },
            { name: 'Card Collector', icon: '🃏' },
            { name: 'Tournament Debut', icon: '🏆' },
            { name: 'Coin Collector', icon: '💸' },
            { name: 'Game Master', icon: '🎮' },
            { name: 'Social Butterfly', icon: '💬' },
            { name: 'Lucky Streak', icon: '🍀' }
        ];

        const recentUnlocks = Array.from({ length: 50 }, (_, i) => {
            const achievement = achievementNames[Math.floor(Math.random() * achievementNames.length)];
            const player = players[Math.floor(Math.random() * Math.min(30, players.length))];
            
            return {
                username: player.username,
                achievementName: achievement.name,
                icon: achievement.icon,
                timestamp: Date.now() - (i * 60000) - Math.random() * 60000 // Spread over last hour
            };
        });

        return { players, recentUnlocks };
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }
        // Clean up WebSocket listeners
        if (window.socket) {
            window.socket.off('achievement:unlock');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.achievementLeaderboards = new AchievementLeaderboards();
});
