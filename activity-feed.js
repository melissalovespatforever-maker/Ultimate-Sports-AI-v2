// ============================================
// LIVE ACTIVITY FEED
// Real-time feed of user achievements and activity
// ============================================

console.log('📰 Loading Activity Feed System');

const ActivityFeed = {
    
    activities: [],
    maxActivities: 50,
    updateInterval: null,
    currentFilter: 'all',

    // Activity types
    types: {
        ACHIEVEMENT: 'achievement',
        GAME_WIN: 'game_win',
        STREAK: 'streak',
        TOURNAMENT: 'tournament',
        LEVEL_UP: 'level_up',
        BIG_WIN: 'big_win',
        CHALLENGE: 'challenge',
        MILESTONE: 'milestone',
        PARLAY_WIN: 'parlay_win',
        BIG_HIT: 'big_hit',
        SHARP_ALERT: 'sharp_alert',
        WHALE_BET: 'whale_bet'
    },

    // Initialize
    init() {
        console.log('📰 Initializing Activity Feed');
        this.loadActivities();
        this.renderFeed();
        this.updateNotificationBadge();
        this.updateFilterCounts();
        this.startAutoUpdate();
        this.setupEventListeners();
    },

    // Load activities from localStorage
    loadActivities() {
        const stored = localStorage.getItem('activityFeed');
        if (stored) {
            this.activities = JSON.parse(stored);
        } else {
            // Generate some initial demo activities
            this.activities = this.generateDemoActivities();
            this.saveActivities();
        }
    },

    // Save activities to localStorage
    saveActivities() {
        // Keep only the most recent activities
        if (this.activities.length > this.maxActivities) {
            this.activities = this.activities.slice(0, this.maxActivities);
        }
        localStorage.setItem('activityFeed', JSON.stringify(this.activities));
    },

    // Add new activity
    addActivity(type, data) {
        const activity = {
            id: Date.now() + Math.random(),
            type,
            timestamp: Date.now(),
            ...data
        };

        this.activities.unshift(activity);
        this.saveActivities();
        this.renderFeed();
        this.updateNotificationBadge();
        this.updateFilterCounts();

        // Show toast notification for user's own activities
        const username = localStorage.getItem('guestUsername') || 'You';
        if (data.username === username) {
            this.showToast(activity);
        }

        console.log('✅ Activity added:', activity);
    },

    // Generate demo activities
    generateDemoActivities() {
        const now = Date.now();
        const activities = [];
        const usernames = ['SportsFan', 'BetMaster', 'ParlayKing', 'StreakHunter', 'AIEnthusiast', 'ProGamer', 'ChampionBetter', 'DataNinja'];
        const avatars = ['🎮', '⚡', '🔥', '💎', '👑', '🏆', '⭐', '🎯'];

        // Recent activities (last 2 hours)
        for (let i = 0; i < 15; i++) {
            const randomUser = usernames[Math.floor(Math.random() * usernames.length)];
            const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
            const minutesAgo = Math.floor(Math.random() * 120) + 1;

            const activityTypes = [
                {
                    type: this.types.ACHIEVEMENT,
                    data: {
                        username: randomUser,
                        avatar: randomAvatar,
                        achievement: this.getRandomAchievement(),
                        timestamp: now - (minutesAgo * 60 * 1000)
                    }
                },
                {
                    type: this.types.GAME_WIN,
                    data: {
                        username: randomUser,
                        avatar: randomAvatar,
                        game: this.getRandomGame(),
                        amount: Math.floor(Math.random() * 500) + 50,
                        timestamp: now - (minutesAgo * 60 * 1000)
                    }
                },
                {
                    type: this.types.STREAK,
                    data: {
                        username: randomUser,
                        avatar: randomAvatar,
                        streak: Math.floor(Math.random() * 20) + 5,
                        timestamp: now - (minutesAgo * 60 * 1000)
                    }
                },
                {
                    type: this.types.TOURNAMENT,
                    data: {
                        username: randomUser,
                        avatar: randomAvatar,
                        tournament: this.getRandomTournament(),
                        place: Math.floor(Math.random() * 3) + 1,
                        prize: Math.floor(Math.random() * 5000) + 500,
                        timestamp: now - (minutesAgo * 60 * 1000)
                    }
                },
                {
                    type: this.types.BIG_WIN,
                    data: {
                        username: randomUser,
                        avatar: randomAvatar,
                        amount: Math.floor(Math.random() * 2000) + 1000,
                        game: this.getRandomGame(),
                        timestamp: now - (minutesAgo * 60 * 1000)
                    }
                },
                {
                    type: this.types.SHARP_ALERT,
                    data: {
                        game: this.getRandomMatchup(),
                        trend: Math.random() > 0.5 ? 'Sharpening' : 'Fading',
                        movement: (Math.random() * 8 + 2).toFixed(1),
                        timestamp: now - (minutesAgo * 60 * 1000)
                    }
                },
                {
                    type: this.types.WHALE_BET,
                    data: {
                        username: usernames[Math.floor(Math.random() * usernames.length)],
                        avatar: '🐋',
                        selection: this.getRandomMatchup(),
                        amount: Math.floor(Math.random() * 50000) + 10000,
                        betType: 'MAX WAGER',
                        timestamp: now - (minutesAgo * 60 * 1000)
                    }
                }
            ];

            const randomActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
            activities.push({
                id: now - i,
                type: randomActivity.type,
                ...randomActivity.data
            });
        }

        return activities.sort((a, b) => b.timestamp - a.timestamp);
    },

    // Get random achievement
    getRandomAchievement() {
        const achievements = [
            { name: 'First Win', icon: '🎯', description: 'Won their first game' },
            { name: 'Hot Streak', icon: '🔥', description: 'Hit a 10-game win streak' },
            { name: 'High Roller', icon: '💎', description: 'Won over 1,000 coins' },
            { name: 'Tournament Champion', icon: '🏆', description: 'Won a tournament' },
            { name: 'Perfect Week', icon: '⭐', description: 'Won every day this week' },
            { name: 'AI Master', icon: '🤖', description: 'Consulted all AI coaches' },
            { name: 'Social Butterfly', icon: '👥', description: 'Made 10 friends' },
            { name: 'Coin Collector', icon: '🪙', description: 'Earned 5,000 total coins' }
        ];
        return achievements[Math.floor(Math.random() * achievements.length)];
    },

    // Get random game
    getRandomGame() {
        const games = ['Parlay Battle', 'Beat the Streak', 'Trivia', 'Slots', 'Wheel', 'Coin Flip', 'Penalty Shootout'];
        return games[Math.floor(Math.random() * games.length)];
    },

    // Get random tournament
    getRandomTournament() {
        const tournaments = ['Bronze League', 'Silver Championship', 'Gold Masters', 'Weekend Warriors', 'Daily Quick Fire'];
        return tournaments[Math.floor(Math.random() * tournaments.length)];
    },

    getRandomMatchup() {
        const matchups = ['LAL @ BOS', 'KC @ PHI', 'NYY @ LAD', 'MCI @ ARS', 'DAL @ SF', 'GSW @ MIL'];
        return matchups[Math.floor(Math.random() * matchups.length)];
    },

    // Render feed
    renderFeed() {
        const container = document.getElementById('activity-feed-list');
        if (!container) return;

        // Filter activities based on current filter
        let filteredActivities = this.activities;
        if (this.currentFilter !== 'all') {
            filteredActivities = this.activities.filter(activity => 
                activity.type === this.currentFilter
            );
        }

        if (filteredActivities.length === 0) {
            const filterName = this.currentFilter === 'all' ? 'recent activity' : 
                              this.currentFilter.replace('_', ' ');
            container.innerHTML = `
                <div class="activity-empty">
                    <div class="empty-icon">📭</div>
                    <p>No ${filterName}</p>
                    <span>Check back soon!</span>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredActivities.slice(0, 20).map(activity => {
            return this.renderActivity(activity);
        }).join('');
    },

    // Render single activity
    renderActivity(activity) {
        const timeAgo = this.getTimeAgo(activity.timestamp);

        switch (activity.type) {
            case this.types.ACHIEVEMENT:
                // Handle both object and string achievement formats
                const achievement = activity.achievement || {};
                const achievementIcon = achievement.icon || '🎯';
                const achievementName = achievement.name || 'Achievement';
                
                return `
                    <div class="activity-item achievement" data-id="${activity.id}">
                        <div class="activity-avatar">${activity.avatar || '🎮'}</div>
                        <div class="activity-content">
                            <div class="activity-main">
                                <strong>${activity.username || 'User'}</strong> unlocked 
                                <span class="activity-highlight">${achievementIcon} ${achievementName}</span>
                            </div>
                            <div class="activity-meta">
                                <span class="activity-time">${timeAgo}</span>
                            </div>
                        </div>
                        <div class="activity-badge achievement-badge">
                            ${achievementIcon}
                        </div>
                    </div>
                `;

            case this.types.GAME_WIN:
                return `
                    <div class="activity-item game-win" data-id="${activity.id}">
                        <div class="activity-avatar">${activity.avatar || '🎮'}</div>
                        <div class="activity-content">
                            <div class="activity-main">
                                <strong>${activity.username || 'User'}</strong> won 
                                <span class="activity-highlight">${activity.amount || 0} coins</span> 
                                in ${activity.game || 'a game'}
                            </div>
                            <div class="activity-meta">
                                <span class="activity-time">${timeAgo}</span>
                            </div>
                        </div>
                        <div class="activity-badge coins-badge">
                            🪙 +${activity.amount || 0}
                        </div>
                    </div>
                `;

            case this.types.STREAK:
                return `
                    <div class="activity-item streak" data-id="${activity.id}">
                        <div class="activity-avatar">${activity.avatar || '🎮'}</div>
                        <div class="activity-content">
                            <div class="activity-main">
                                <strong>${activity.username || 'User'}</strong> reached a 
                                <span class="activity-highlight">${activity.streak || 0}-game win streak!</span>
                            </div>
                            <div class="activity-meta">
                                <span class="activity-time">${timeAgo}</span>
                            </div>
                        </div>
                        <div class="activity-badge streak-badge">
                            🔥 ${activity.streak || 0}
                        </div>
                    </div>
                `;

            case this.types.TOURNAMENT:
                const medal = (activity.place === 1) ? '🥇' : (activity.place === 2) ? '🥈' : '🥉';
                const placeText = (activity.place === 1) ? '1st' : (activity.place === 2) ? '2nd' : '3rd';
                return `
                    <div class="activity-item tournament" data-id="${activity.id}">
                        <div class="activity-avatar">${activity.avatar || '🎮'}</div>
                        <div class="activity-content">
                            <div class="activity-main">
                                <strong>${activity.username || 'User'}</strong> placed 
                                <span class="activity-highlight">${medal} ${placeText}</span> 
                                in ${activity.tournament || 'a tournament'}
                            </div>
                            <div class="activity-meta">
                                <span class="activity-time">${timeAgo}</span>
                                <span class="activity-prize">Prize: ${(activity.prize || 0).toLocaleString()} coins</span>
                            </div>
                        </div>
                        <div class="activity-badge tournament-badge">
                            ${medal}
                        </div>
                    </div>
                `;

            case this.types.BIG_WIN:
                return `
                    <div class="activity-item big-win" data-id="${activity.id}">
                        <div class="activity-avatar">${activity.avatar || '🎮'}</div>
                        <div class="activity-content">
                            <div class="activity-main">
                                <strong>${activity.username || 'User'}</strong> hit a 
                                <span class="activity-highlight">MEGA WIN</span> 
                                of ${(activity.amount || 0).toLocaleString()} coins in ${activity.game || 'a game'}!
                            </div>
                            <div class="activity-meta">
                                <span class="activity-time">${timeAgo}</span>
                            </div>
                        </div>
                        <div class="activity-badge big-win-badge">
                            💰 ${(activity.amount || 0).toLocaleString()}
                        </div>
                    </div>
                `;

            case this.types.LEVEL_UP:
                return `
                    <div class="activity-item level-up" data-id="${activity.id}">
                        <div class="activity-avatar">${activity.avatar || '🎮'}</div>
                        <div class="activity-content">
                            <div class="activity-main">
                                <strong>${activity.username || 'User'}</strong> leveled up to 
                                <span class="activity-highlight">Level ${activity.level || 1}</span>
                            </div>
                            <div class="activity-meta">
                                <span class="activity-time">${timeAgo}</span>
                            </div>
                        </div>
                        <div class="activity-badge level-badge">
                            ⬆️ ${activity.level || 1}
                        </div>
                    </div>
                `;

            case this.types.MILESTONE:
                return `
                    <div class="activity-item milestone" data-id="${activity.id}">
                        <div class="activity-avatar">${activity.avatar || '🎮'}</div>
                        <div class="activity-content">
                            <div class="activity-main">
                                <strong>${activity.username || 'User'}</strong> reached 
                                <span class="activity-highlight">${activity.milestone || 'a milestone'}</span>
                            </div>
                            <div class="activity-meta">
                                <span class="activity-time">${timeAgo}</span>
                            </div>
                        </div>
                        <div class="activity-badge milestone-badge">
                            🎯
                        </div>
                    </div>
                `;

            case this.types.PARLAY_WIN:
                return `
                    <div class="activity-item parlay-win" data-id="${activity.id}">
                        <div class="activity-avatar">${activity.avatar || '🎮'}</div>
                        <div class="activity-content">
                            <div class="activity-main">
                                <strong>${activity.username || 'User'}</strong> hit a 
                                <span class="activity-highlight">${activity.legs}-leg Parlay</span> 
                                at <strong>+${activity.odds}</strong> odds!
                            </div>
                            <div class="activity-meta">
                                <span class="activity-time">${timeAgo}</span>
                                <span class="activity-prize">Won: ${activity.amount} coins</span>
                            </div>
                        </div>
                        <div class="activity-badge parlay-badge">
                            📈
                        </div>
                    </div>
                `;

            case this.types.BIG_HIT:
                return `
                    <div class="activity-item big-hit" data-id="${activity.id}">
                        <div class="activity-avatar">🤖</div>
                        <div class="activity-content">
                            <div class="activity-main">
                                <span class="activity-highlight">AI BIG HIT ALERT!</span> 
                                ${activity.coach || 'Coach'} just projected a massive value hit on 
                                <strong>${activity.selection}</strong>.
                            </div>
                            <div class="activity-meta">
                                <span class="activity-time">${timeAgo}</span>
                                <span class="activity-prize">Edge: +${activity.edge}%</span>
                            </div>
                        </div>
                        <div class="activity-badge big-hit-badge">
                            ⚡
                        </div>
                    </div>
                `;

            case this.types.SHARP_ALERT:
                const alertColor = activity.trend === 'Sharpening' ? '#10b981' : '#ef4444';
                const alertIcon = activity.trend === 'Sharpening' ? '📈' : '📉';
                return `
                    <div class="activity-item sharp-alert" data-id="${activity.id}">
                        <div class="activity-avatar">🎯</div>
                        <div class="activity-content">
                            <div class="activity-main">
                                <span class="activity-highlight" style="color: ${alertColor}">SHARP ODDS ALERT!</span> 
                                Rapid movement in <strong>${activity.game}</strong>. 
                                Market is <strong>${activity.trend}</strong>.
                            </div>
                            <div class="activity-meta">
                                <span class="activity-time">${timeAgo}</span>
                                <span class="activity-prize">Movement: ${activity.movement}%</span>
                            </div>
                        </div>
                        <div class="activity-badge sharp-badge">
                            ${alertIcon}
                        </div>
                    </div>
                `;

            case this.types.WHALE_BET:
                return `
                    <div class="activity-item whale-bet" data-id="${activity.id}">
                        <div class="activity-avatar">🐋</div>
                        <div class="activity-content">
                            <div class="activity-main">
                                <span class="activity-highlight" style="color: #0ea5e9">WHALE TRACKER:</span> 
                                <strong>${activity.username}</strong> just placed a massive 
                                <span class="activity-highlight">${(activity.amount).toLocaleString()} coin</span> wager on 
                                <strong>${activity.selection}</strong>.
                            </div>
                            <div class="activity-meta">
                                <span class="activity-time">${timeAgo}</span>
                                <span class="activity-prize">Type: ${activity.betType}</span>
                            </div>
                        </div>
                        <div class="activity-badge whale-badge">
                            🐋 MASSIVE
                        </div>
                    </div>
                `;

            default:
                return '';
        }
    },

    // Get time ago string
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return `${Math.floor(seconds / 604800)}w ago`;
    },

    // Show toast notification
    showToast(activity) {
        const toast = document.createElement('div');
        toast.className = 'activity-toast';
        
        let message = '';
        switch (activity.type) {
            case this.types.ACHIEVEMENT:
                message = `🎉 Achievement Unlocked: ${activity.achievement.name}!`;
                break;
            case this.types.GAME_WIN:
                message = `🎉 You won ${activity.amount} coins!`;
                break;
            case this.types.STREAK:
                message = `🔥 ${activity.streak}-game win streak!`;
                break;
            case this.types.BIG_WIN:
                message = `💰 MEGA WIN! ${activity.amount.toLocaleString()} coins!`;
                break;
            case this.types.TOURNAMENT:
                const medal = activity.place === 1 ? '🥇' : activity.place === 2 ? '🥈' : '🥉';
                message = `${medal} You placed ${activity.place}${activity.place === 1 ? 'st' : activity.place === 2 ? 'nd' : 'rd'}!`;
                break;
        }

        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${activity.avatar}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // Start auto-update (simulate live activity)
    startAutoUpdate() {
        // Add random activity every 15-45 seconds
        this.updateInterval = setInterval(() => {
            if (Math.random() > 0.5) {
                const usernames = ['SportsFan', 'BetMaster', 'ParlayKing', 'StreakHunter'];
                const avatars = ['🎮', '⚡', '🔥', '💎'];
                const randomUser = usernames[Math.floor(Math.random() * usernames.length)];
                const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

                const activityTypes = [
                    {
                        type: this.types.GAME_WIN,
                        data: {
                            username: randomUser,
                            avatar: randomAvatar,
                            game: this.getRandomGame(),
                            amount: Math.floor(Math.random() * 300) + 50
                        }
                    },
                    {
                        type: this.types.ACHIEVEMENT,
                        data: {
                            username: randomUser,
                            avatar: randomAvatar,
                            achievement: this.getRandomAchievement()
                        }
                    }
                ];

                const randomActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
                this.addActivity(randomActivity.type, randomActivity.data);
            }
        }, Math.floor(Math.random() * 30000) + 15000); // 15-45 seconds
    },

    // Stop auto-update
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Notifications button (bell icon)
        const notificationsBtn = document.getElementById('notifications-btn');
        const notificationsDropdown = document.getElementById('notifications-dropdown');
        
        if (notificationsBtn && notificationsDropdown) {
            notificationsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = notificationsDropdown.style.display !== 'none';
                notificationsDropdown.style.display = isVisible ? 'none' : 'block';
                
                // Update badge count when opening
                if (!isVisible) {
                    this.updateNotificationBadge();
                }
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!notificationsDropdown.contains(e.target) && e.target !== notificationsBtn) {
                    notificationsDropdown.style.display = 'none';
                }
            });
        }
        
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const filter = btn.getAttribute('data-filter');
                this.setFilter(filter);
                
                // Update active state
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Refresh button in dropdown
        const refreshBtn = document.getElementById('notifications-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.renderFeed();
                this.showRefreshAnimation(refreshBtn);
            });
        }
        
        // Legacy refresh button (if exists on page)
        const oldRefreshBtn = document.getElementById('activity-feed-refresh');
        if (oldRefreshBtn) {
            oldRefreshBtn.addEventListener('click', () => {
                this.renderFeed();
                this.showRefreshAnimation(oldRefreshBtn);
            });
        }
    },

    // Show refresh animation
    showRefreshAnimation(btn) {
        if (!btn) {
            btn = document.getElementById('notifications-refresh') || document.getElementById('activity-feed-refresh');
        }
        if (btn) {
            btn.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                btn.style.transform = 'rotate(0deg)';
            }, 500);
        }
    },
    
    // Update notification badge count
    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            const count = this.activities.length;
            badge.textContent = count > 99 ? '99+' : count;
        }
    },
    
    // Set activity filter
    setFilter(filterType) {
        this.currentFilter = filterType;
        this.renderFeed();
        console.log('📋 Filter set to:', filterType);
    },
    
    // Get count for specific activity type
    getActivityCount(type) {
        if (type === 'all') return this.activities.length;
        return this.activities.filter(a => a.type === type).length;
    },
    
    // Update filter count badges
    updateFilterCounts() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            const filterType = btn.getAttribute('data-filter');
            const count = this.getActivityCount(filterType);
            
            // Remove existing count badge if present
            const existingBadge = btn.querySelector('.filter-count');
            if (existingBadge) {
                existingBadge.remove();
            }
            
            // Add count badge
            if (count > 0) {
                const countBadge = document.createElement('span');
                countBadge.className = 'filter-count';
                countBadge.textContent = count > 99 ? '99+' : count;
                btn.appendChild(countBadge);
            }
        });
    },

    // Public method to log game win
    logGameWin(game, amount) {
        const username = localStorage.getItem('guestUsername') || 'You';
        const avatar = localStorage.getItem('guestAvatar') || '🎮';
        
        // Play coin sound for game wins
        if (window.SoundEffects) {
            SoundEffects.playCoinSound();
        }
        
        this.addActivity(this.types.GAME_WIN, {
            username,
            avatar,
            game,
            amount
        });
    },

    // Public method to log achievement
    logAchievement(achievement) {
        const username = localStorage.getItem('guestUsername') || 'You';
        const avatar = localStorage.getItem('guestAvatar') || '🎮';
        
        // Play success ping for achievements
        if (window.SoundEffects) {
            SoundEffects.playSuccessPing();
        }
        
        this.addActivity(this.types.ACHIEVEMENT, {
            username,
            avatar,
            achievement
        });
    },

    // Public method to log streak
    logStreak(streak) {
        const username = localStorage.getItem('guestUsername') || 'You';
        const avatar = localStorage.getItem('guestAvatar') || '🎮';
        
        this.addActivity(this.types.STREAK, {
            username,
            avatar,
            streak
        });
    },

    // Public method to log tournament result
    logTournament(tournament, place, prize) {
        const username = localStorage.getItem('guestUsername') || 'You';
        const avatar = localStorage.getItem('guestAvatar') || '🎮';
        
        // Trigger confetti for 1st place finishes
        if (place === 1 && window.ConfettiEffect) {
            ConfettiEffect.celebration(150);
            
            // Play celebration sound
            if (window.SoundEffects) {
                SoundEffects.playCelebrationChime();
            }
        }
        
        this.addActivity(this.types.TOURNAMENT, {
            username,
            avatar,
            tournament,
            place,
            prize
        });
    },

    // Public method to log big win
    logBigWin(game, amount) {
        const username = localStorage.getItem('guestUsername') || 'You';
        const avatar = localStorage.getItem('guestAvatar') || '🎮';
        
        // Play victory fanfare for big wins
        if (window.SoundEffects) {
            SoundEffects.playVictoryFanfare();
        }
        
        this.addActivity(this.types.BIG_WIN, {
            username,
            avatar,
            game,
            amount
        });
    },

    // Public method to log parlay win
    logParlayWin(legs, odds, amount) {
        const username = localStorage.getItem('guestUsername') || 'You';
        const avatar = localStorage.getItem('guestAvatar') || '🎮';
        
        if (window.ConfettiEffect) {
            ConfettiEffect.celebration(100);
        }

        this.addActivity(this.types.PARLAY_WIN, {
            username,
            avatar,
            legs,
            odds,
            amount
        });
    },

    // Public method to log AI Big Hit
    logBigHit(coach, selection, edge) {
        this.addActivity(this.types.BIG_HIT, {
            coach,
            selection,
            edge
        });
    },

    // Public method to log Sharp Odds Alert
    logSharpAlert(game, trend, movement) {
        this.addActivity(this.types.SHARP_ALERT, {
            game,
            trend,
            movement,
            avatar: '🎯'
        });
        
        // Also show a toast for sharp alerts
        if (typeof showToast === 'function') {
            const icon = trend === 'Sharpening' ? '📈' : '📉';
            showToast(`${icon} SHARP ALERT: ${game} is ${trend} (${movement}%)`, 'warning');
        }
    },

    // Public method to log Whale Bet
    logWhaleBet(username, selection, amount, betType) {
        this.addActivity(this.types.WHALE_BET, {
            username,
            selection,
            amount,
            betType,
            avatar: '🐋'
        });
        
        // Show high-priority toast for whale movement
        if (typeof showToast === 'function' && amount >= 10000) {
            showToast(`🐋 WHALE TRACKER: ${username} bet ${amount.toLocaleString()} on ${selection}`, 'info');
        }
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize if notifications dropdown exists
        if (document.getElementById('notifications-dropdown') || document.getElementById('activity-feed-list')) {
            ActivityFeed.init();
        }
    });
} else {
    // Initialize if notifications dropdown exists
    if (document.getElementById('notifications-dropdown') || document.getElementById('activity-feed-list')) {
        ActivityFeed.init();
    }
}

// Export for global access
window.ActivityFeed = ActivityFeed;

console.log('✅ Activity Feed System Loaded');
